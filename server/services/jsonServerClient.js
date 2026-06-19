const JSON_SERVER_URL = process.env.JSON_SERVER_URL || 'http://localhost:3001';

async function requestJson(path, options = {}) {
  const response = await fetch(`${JSON_SERVER_URL}${path}`, options);
  const text = await response.text();

  let body = text;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    // keep raw text
  }

  if (!response.ok) {
    const message = body && typeof body === 'object' && body.message
      ? body.message
      : `JSON Server request failed (${response.status})`;
    throw new Error(message);
  }

  return body;
}

async function getCategory(id) {
  if (!id) {
    return null;
  }

  try {
    return await requestJson(`/categories/${id}`);
  } catch {
    return null;
  }
}

async function getArticle(id) {
  const article = await requestJson(`/articles/${id}`);
  if (article?.categorie_id) {
    article.Category = await getCategory(article.categorie_id);
  }
  return article;
}

async function listArticles() {
  const articles = await requestJson('/articles');
  const categories = await requestJson('/categories');
  const categoryMap = Object.fromEntries(categories.map((category) => [category.id, category]));

  return articles.map((article) => ({
    ...article,
    Category: categoryMap[article.categorie_id] || null
  }));
}

async function countArticles() {
  const articles = await requestJson('/articles');
  return Array.isArray(articles) ? articles.length : 0;
}

module.exports = {
  getArticle,
  getCategory,
  listArticles,
  countArticles
};
