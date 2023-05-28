import { AppendNote, Note, StorageAdapter } from "../StorageAdapter";
import { uuid } from "@cfworker/uuid";
import { Client } from "@notionhq/client";
import { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";

export type createNotionDatabaseOptions = {
    NOTION_API_TOKEN: string;
    NOTION_DATABASE_ID: string;
};
type PropertyTypes = ExtractRecordValue<PageObjectResponse["properties"]>;
type ExtractRecordValue<R> = R extends Record<infer _, infer V> ? V : never;
export const prop = <F extends PropertyTypes, T extends F["type"]>(o: F, type: T) => {
    if (o.type !== type) {
        throw new Error("invalid type:" + JSON.stringify(o));
    }
    return o as T extends F["type"] ? Extract<F, { type: T }> : never;
};

export const createNotionStorage = ({
    NOTION_API_TOKEN,
    NOTION_DATABASE_ID
}: createNotionDatabaseOptions): StorageAdapter => {
    const notionClient = new Client({
        auth: NOTION_API_TOKEN
    });
    return {
        async getNotes(listId: string): Promise<Note[]> {
            console.log("getNotes", listId);
            const { results } = await notionClient.databases.query({
                database_id: NOTION_DATABASE_ID,
                filter: {
                    property: "NoteKey",
                    select: {
                        equals: listId
                    }
                }
            });
            return results.map((page) => {
                const ret = page as PageObjectResponse;
                return {
                    id: ret.id,
                    message: prop(ret.properties.Message, "title").title[0].plain_text,
                    timestamp: new Date(ret.created_time).getTime()
                };
            });
        },
        async appendNote(listId: string, note: AppendNote): Promise<Note> {
            const result = (await notionClient.pages.create({
                parent: {
                    database_id: NOTION_DATABASE_ID
                },
                properties: {
                    Message: {
                        title: [
                            {
                                text: {
                                    content: note.message
                                }
                            }
                        ]
                    },
                    NoteKey: {
                        select: {
                            name: listId
                        }
                    }
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
