export function indexDocuments(docs: Array<{ id: string; content: string }>) {
  // stub: index documents for semantic search
  return docs.map(d => ({ id: d.id, tokens: d.content.split(/\s+/).length }));
}

export default indexDocuments;
