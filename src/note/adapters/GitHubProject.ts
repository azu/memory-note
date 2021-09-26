import { AppendNote, Note, StorageAdapter } from "../StorageAdapter";
import { Octokit } from "@octokit/core";

// $ wrangler secret put GITHUB_TOKEN
// <INPUT_YOUR_API_TOKEN>
declare var GITHUB_TOKEN: string;

type ProjectResponse = {
    repository: {
        project: {
            columns: {
                nodes: {
                    resourcePath: string; // "/azu/test/projects/1/columns/11111"
                    cards: {
                        nodes: {
                            databaseId: string;
                            note: string;
                            updatedAt: string;
                            content: null | {
                                id: string;
                                number: number;
                                title: string;
                            };
                        }[];
                    };
                }[];
            };
        };
    };
};
const findInboxColumn = (
    response: ProjectResponse,
    columnId: number
): ProjectResponse["repository"]["project"]["columns"]["nodes"][number] | undefined => {
    return response.repository.project.columns.nodes.find((node) => {
        return node.resourcePath.endsWith(`/${columnId}`);
    });
};
// noteKey is column_id
// example. 1123413 from https://github.com/owner/repo/projects/1#column-1123413
export const createGitHubProjectStorage = ({
    owner,
    repo,
    projectId,
    deleteMode = "ARCHIVE"
}: {
    owner: string;
    repo: string;
    projectId: number;
    deleteMode?: "DELETE" | "ARCHIVE";
}): StorageAdapter => {
    const octokit = new Octokit({ auth: GITHUB_TOKEN });
    return {
        async getNotes(columnId: string): Promise<Note[]> {
            const response: ProjectResponse = await octokit.graphql(
                `query ($owner: String!, $repo: String!, $projectId: Int!) {
  repository(owner: $owner, name: $repo) {
    project(number: $projectId) {
      columns(first: 10) {
        nodes {
          resourcePath
          cards (archivedStates: NOT_ARCHIVED) {
            nodes {
              databaseId
              note
              updatedAt
              content {
                ... on Issue {
                  id
                  number
                  title
                }
                ... on PullRequest {
                  id
                  number
                  title
                }
              }
            }
          }
        }
      }
    }
  }
}
`,
                {
                    owner: owner,
                    repo: repo,
                    projectId: projectId
                }
            );
            const column = findInboxColumn(response, Number(columnId));
            if (!column) {
                return [];
            }
            return column.cards.nodes.map((node) => {
                return {
                    id: node.databaseId,
                    message: node.note || node.content?.title || "",
                    timestamp: new Date(node.updatedAt).getTime()
                };
            });
        },
        async appendNote(columnId: string, note: AppendNote): Promise<Note> {
            // https://docs.github.com/ja/rest/reference/projects#create-a-project-card
            const { data } = await octokit.request("POST /projects/columns/{column_id}/cards", {
                note: note.message,
                column_id: Number(columnId),
                mediaType: {
                    previews: ["inertia"]
                }
            });
            const response: { id: number; note: string | null; created_at: string } = data;
            return {
                id: String(response.id),
                message: note.message ?? "",
                timestamp: new Date(response.created_at).getTime()
            };
        },
        async deleteNote(columnId: string, id: Note["id"]): Promise<Note> {
            const { data } = await octokit.request("GET /projects/columns/cards/{card_id}", {
                card_id: Number(id), // card_id should be number
                mediaType: {
                    previews: ["inertia"]
                }
            });
            const card: { id: number; note: string | null; updated_at: string } = data;
            if (deleteMode === "ARCHIVE") {
                // https://docs.github.com/ja/rest/reference/projects#update-an-existing-project-card
                await octokit.request("PATCH /projects/columns/cards/{card_id}", {
                    card_id: Number(id),
                    archived: true,
                    mediaType: {
                        previews: ["inertia"]
                    }
                });
            } else {
                // https://docs.github.com/ja/rest/reference/projects#delete-a-project-card
                await octokit.request("DELETE /projects/columns/cards/{card_id}", {
                    card_id: Number(id), // card_id should be number
                    mediaType: {
                        previews: ["inertia"]
                    }
                });
            }
            return {
                id: String(card.id),
                message: card.note ?? "",
                timestamp: new Date(card.updated_at).getTime()
            };
        }
    };
};
