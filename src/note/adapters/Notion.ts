import { AppendNote, Note, StorageAdapter } from "../StorageAdapter";
import { Client } from "@notionhq/client";
import { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";

// :listId is notion database id
export type createNotionDatabaseSimple = {
    NOTION_API_TOKEN: string;
    // title property name
    NOTION_MESSAGE_PROPERTY_NAME: string; // should be title
};
export type NotionFilterOption =
    | {
          name: string;
          type: "checkbox";
          value: string;
      }
    | {
          name: string;
          type: "relation";
          value: string;
      }
    | {
          name: string;
          type: "select";
          value: string;
          op?: "equals" | "does_not_equal";
      }
    | {
          name: string;
          type: "status";
          value: string;
          op?: "equals" | "does_not_equal";
      };
export type createNotionDatabaseExtended = createNotionDatabaseSimple & {
    // json value as a string
    // NotionFilterOption[] (and)
    // example: '[{"name":"category","type":"select","value":"test"},{"name":"category","type":"checkbox","value":false}]'
    NOTION_FILTER_OPTIONS: string;
};
const parseNotionFilterOption = (optionStr: string) => {
    try {
        return JSON.parse(optionStr) as NotionFilterOption[];
    } catch (e) {
        throw new Error("invalid NOTION_FILTER_OPTIONS:" + optionStr);
    }
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
    const { NOTION_API_TOKEN, NOTION_MESSAGE_PROPERTY_NAME } = options;
    const notionClient = new Client({
        auth: NOTION_API_TOKEN
    });
    const notionMessagePropertyName = NOTION_MESSAGE_PROPERTY_NAME;
    if (!notionMessagePropertyName)
        throw new Error("invalid NOTION_MESSAGE_PROPERTY_NAME:" + notionMessagePropertyName);

    const notionCheckboxOption = (() => {
        if (!("NOTION_CHECKBOX_PROPERTY_NAME" in options)) return undefined;
        return {
            name: options.NOTION_CHECKBOX_PROPERTY_NAME
        };
    })();
    return {
        async getNotes(databaseId: string): Promise<Note[]> {
            const notionFilterOptions =
                "NOTION_FILTER_OPTIONS" in options ? parseNotionFilterOption(options.NOTION_FILTER_OPTIONS) : undefined;
            const convertToFilter = (option: NotionFilterOption) => {
                if (!option) throw new Error("invalid option");
                if (option?.value !== undefined) throw new Error("invalid option value");
                if (option?.name !== undefined) throw new Error("invalid option name");
                if (option.type === "select" || option.type === "status") {
                    if (!option.op || option.op === "equals") {
                        return {
                            property: option.name,
                            select: {
                                equals: option.value
                            }
                        };
                    } else if (option.op === "does_not_equal") {
                        return {
                            property: option.name,
                            select: {
                                does_not_equal: option.value
                            }
                        };
                    }
                } else if (option.type === "relation") {
                    return {
                        property: option.name,
                        relation: {
                            contains: option.value
                        }
                    };
                } else if (option.type === "checkbox") {
                    return {
                        property: option.name,
                        checkbox: {
                            equals: Boolean(option.value)
                        }
                    };
                }
                throw new Error("not supported filter option:" + option?.type);
            };
            const filter = (() => {
                if (!notionFilterOptions) return undefined;
                if (notionFilterOptions.length === 0) return undefined;
                if (notionFilterOptions.length === 1) return convertToFilter(notionFilterOptions[0]);
                return {
                    and: notionFilterOptions.map(convertToFilter)
                };
            })();
            const { results } = await notionClient.databases.query({
                database_id: databaseId,
                filter: filter ? filter : undefined
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
        async appendNote(databaseId: string, note: AppendNote): Promise<Note> {
            const notionFilterOptions =
                "NOTION_FILTER_OPTIONS" in options ? parseNotionFilterOption(options.NOTION_FILTER_OPTIONS) : undefined;
            const convertProperty = (option: NotionFilterOption) => {
                if (option?.type === "select") {
                    return [
                        option?.name,
                        {
                            select: {
                                name: option?.value
                            }
                        }
                    ];
                } else if (option?.type === "relation") {
                    return [
                        option?.name,
                        {
                            relation: [
                                {
                                    id: option?.value
                                }
                            ]
                        }
                    ];
                } else if (option?.type === "checkbox") {
                    return [
                        option?.name,
                        {
                            checkbox: Boolean(option?.value)
                        }
                    ];
                }
                throw new Error("non supported filter option" + option?.type);
            };
            const filterProperties = notionFilterOptions
                ? Object.fromEntries(notionFilterOptions.map(convertProperty))
                : [];
            const properties = {
                [notionMessagePropertyName]: {
                    title: [
                        {
                            text: {
                                content: note.message
                            }
                        }
                    ]
                },
                ...(filterProperties ? filterProperties : {})
            };
            console.log("create to database_id", databaseId);
            console.log("create properties", JSON.stringify(properties, null, 4));
            const result = (await notionClient.pages.create({
                parent: {
                    database_id: databaseId
                },
                properties: properties
            })) as PageObjectResponse;
            console.log("create result", JSON.stringify(result, null, 4));
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
