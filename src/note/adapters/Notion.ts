import { AppendNote, Note, StorageAdapter } from "../StorageAdapter";
import { Client } from "@notionhq/client";
import { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";

export type createNotionDatabaseSimple = {
    NOTION_API_TOKEN: string;
    NOTION_DATABASE_ID: string;
    // title property name
    NOTION_MESSAGE_PROPERTY_NAME: string; // should be title
};
// list value is :listId param value
export type createNotionDatabaseExtended = createNotionDatabaseSimple & {
    // list property name
    NOTION_LIST_PROPERTY_NAME: string;
    // list property type
    NOTION_LIST_TYPE: "select" | "relation";
};
export type createNotionDatabaseOptions = createNotionDatabaseSimple | createNotionDatabaseExtended;
type PropertyTypes = ExtractRecordValue<PageObjectResponse["properties"]>;
type ExtractRecordValue<R> = R extends Record<infer _, infer V> ? V : never;
export const prop = <F extends PropertyTypes, T extends F["type"]>(o: F, type: T) => {
    if (o.type !== type) {
        throw new Error("invalid type:" + JSON.stringify(o));
    }
    return o as T extends F["type"] ? Extract<F, { type: T }> : never;
};

export const createNotionStorage = (options: createNotionDatabaseOptions): StorageAdapter => {
    const { NOTION_API_TOKEN, NOTION_DATABASE_ID, NOTION_MESSAGE_PROPERTY_NAME } = options;
    const notionClient = new Client({
        auth: NOTION_API_TOKEN
    });
    const notionMessagePropertyName = NOTION_MESSAGE_PROPERTY_NAME;
    if (!notionMessagePropertyName)
        throw new Error("invalid NOTION_MESSAGE_PROPERTY_NAME:" + notionMessagePropertyName);
    const notionListOption = (() => {
        if (!("NOTION_LIST_PROPERTY_NAME" in options)) return undefined;
        const { NOTION_LIST_PROPERTY_NAME, NOTION_LIST_TYPE } = options as createNotionDatabaseExtended;
        const notionListType = NOTION_LIST_TYPE;
        if (!notionListType) throw new Error("invalid NOTION_LIST_TYPE:" + notionListType);
        const notionListPropertyName = NOTION_LIST_PROPERTY_NAME;
        if (!notionListPropertyName) throw new Error("invalid NOTION_LIST_PROPERTY_NAME:" + notionListPropertyName);
        return {
            type: notionListType,
            name: notionListPropertyName
        };
    })();
    return {
        async getNotes(listId: string): Promise<Note[]> {
            const filter = (() => {
                if (notionListOption?.type === "select") {
                    return {
                        property: notionListOption?.name,
                        select: {
                            equals: listId
                        }
                    };
                } else if (notionListOption?.type === "relation") {
                    return {
                        property: notionListOption?.name,
                        relation: {
                            contains: listId
                        }
                    };
                }
                throw new Error("invalid NOTION_LIST_TYPE:" + notionListOption?.type);
            })();
            const { results } = await notionClient.databases.query({
                database_id: NOTION_DATABASE_ID,
                filter: notionListOption ? filter : undefined
            });
            return results.map((page) => {
                const ret = page as PageObjectResponse;
                return {
                    id: ret.id,
                    message: prop(ret.properties[notionMessagePropertyName], "title").title[0].plain_text,
                    timestamp: new Date(ret.created_time).getTime()
                };
            });
        },
        async appendNote(listId: string, note: AppendNote): Promise<Note> {
            const notionListProperty = (() => {
                if (notionListOption?.type === "select") {
                    return {
                        [notionListOption?.name]: {
                            select: {
                                name: listId
                            }
                        }
                    };
                } else if (notionListOption?.type === "relation") {
                    return {
                        [notionListOption?.name]: {
                            relation: [
                                {
                                    id: listId
                                }
                            ]
                        }
                    };
                }
                throw new Error("invalid NOTION_LIST_TYPE:" + notionListOption?.type);
            })();
            const result = (await notionClient.pages.create({
                parent: {
                    database_id: NOTION_DATABASE_ID
                },
                properties: {
                    [notionMessagePropertyName]: {
                        title: [
                            {
                                text: {
                                    content: note.message
                                }
                            }
                        ]
                    },
                    ...(notionListOption ? notionListProperty : {})
                }
            })) as PageObjectResponse;
            return {
                id: result.id,
                message: note.message,
                timestamp: new Date(result.created_time).getTime()
            };
        },
        async deleteNote(listId: string, nodeId: Note["id"]): Promise<Note> {
            await notionClient.pages.update({
                page_id: nodeId,
                archived: true
            });
            return {
                id: nodeId,
                message: "",
                timestamp: Date.now()
            };
        }
    };
};
