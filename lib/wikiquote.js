const cheerio = require("cheerio");
const client = require("./client");

/**
 * @param {string} query The search terms used to query page titles
 * @return {Promise}
 */
exports.searchByTitle = async (query, opts = {}) => {
  const results = await client.get({
    query: `?srsearch=${query}&action=query&list=search&srwhat=nearmatch&format=json&origin=*`,
    ...opts,
  });
  return results.query.search.map((r) => {
    return {
      title: r.title,
      pageid: r.pageid,
      wordcount: r.wordcount,
    };
  });
};

/**
 * @param {string} query The search terms used to query wikiquote
 * @return {Promise}
 */
exports.search = async (query, opts = {}) => {
  const results = await client.get({
    query: `?format=json&action=query&list=search&origin=*&continue=&srsearch=${query}`,
    ...opts,
  });
  return results.query.search.map((r) => {
    return {
      title: r.title,
      pageid: r.pageid,
      wordcount: r.wordcount,
    };
  });
};

/**
 * @param {string} query The search terms used to query people
 * @return {Promise}
 */
exports.searchPeople = async (query, opts = {}) => {
  const results = await client.get({
    query: `?srsearch=${query}&action=query&list=search&origin=*&srwhat=nearmatch&format=json`,
    ...opts,
  });
  return results.query.search.map((r) => {
    return {
      title: r.title,
      pageid: r.pageid,
      wordcount: r.wordcount,
    };
  });
};

/**
 * @param {string} pageTitle
 * @return {Promise}
 */
exports.getPageSections = async (pageTitle, opts = {}) => {
  const results = await client.get({
    query: `?page=${pageTitle}&action=parse&origin=*&prop=sections&format=json`,
    ...opts,
  });
  return results.parse;
};

/**
 * @param {string} pageId
 * @return {Promise}
 */
exports.getPageSectionsById = async (pageId, opts = {}) => {
  const results = await client.get({
    query: `?pageid=${pageId}&action=parse&origin=*&prop=sections&format=json`,
    ...opts,
  });
  return results.parse;
};

/**
 * @param {string} pageTitle
 * @param {integer} sectionIndex
 * @return {Promise}
 */
exports.getSectionContent = async (pageTitle, sectionIndex, opts = {}) => {
  const results = await client.get({
    query: `?page=${pageTitle}&section=${sectionIndex}&action=parse&prop=text&format=json&origin=*`,
    ...opts,
  });

  const $ = cheerio.load(results.parse.text["*"]);

  const isQuoteSection = (i, el) => {
    const elClass = $(el).attr("class");

    return elClass ? !elClass.match(/toc/) : true;
  };

  return $("ul > li")
    .not("ul > li > ul > li")
    .filter(isQuoteSection)
    .map((i, el) => {
      const quoteSource = $(el).find("li").text();
      return {
        quote: $(el).text(),
        source: quoteSource ? (quoteSource === "" ? null : quoteSource) : null,
      };
    })
    .get();
};

/**
 * @param {string} pageId
 * @param {integer} sectionIndex
 * @return {Promise}
 */
exports.getSectionContentById = async (pageId, sectionIndex, opts = {}) => {
  const results = await client.get({
    query: `?pageid=${pageId}&section=${sectionIndex}&action=parse&prop=text&format=json&origin=*`,
    ...opts,
  });

  const $ = cheerio.load(results.parse.text["*"]);

  const isQuoteSection = (i, el) => {
    const elClass = $(el).attr("class");

    return elClass ? !elClass.match(/toc/) : true;
  };

  return $("ul > li")
    .not("ul > li > ul > li")
    .filter(isQuoteSection)
    .map((i, el) => {
      const quoteSource = $(el).find("li").text();
      return {
        quote: $(el).text(),
        source: quoteSource ? (quoteSource === "" ? null : quoteSource) : null,
      };
    })
    .get();
};

/**
 * @param {string} pageTitle
 * @return {Promise}
 */
exports.list = async (pageTitle, opts = {}) => {
  const sections = (await exports.getPageSections(pageTitle, opts)).sections;
  const quotes = await Promise.all(
    sections.map((s) => exports.getSectionContent(pageTitle, s.index, opts))
  );
  return [].concat(...quotes);
};

/**
 * @param {string} pageId
 * @return {Promise}
 */
exports.listById = async (pageId, opts = {}) => {
  const sections = (await exports.getPageSectionsById(pageId, opts)).sections;

  const quotes = await Promise.all(
    sections.map((s) => exports.getSectionContentById(pageId, s.index, opts))
  );

  return [].concat(...quotes);
};

/**
 * @param {string} pageTitle
 * @return {Promise}
 */
exports.getRandomQuote = async (pageTitle, opts = {}) => {
  const quotes = await exports.list(pageTitle, opts);
  return quotes[Math.floor(Math.random() * quotes.length)].quote;
};

/**
 * @param {string} pageId
 * @return {Promise}
 */
exports.getRandomQuoteById = async (pageId, opts = {}) => {
  const quotes = await exports.listById(pageId, opts);
  return quotes[Math.floor(Math.random() * quotes.length)].quote;
};
