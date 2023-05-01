const Mustache = require('mustache');
const fs = require('fs');
const request = require('then-request');
const { parse } = require('node-html-parser');

const MAIN_TEMPLATE = './templates/main.mustache';
const SAP_COMMUNITY = './templates/sap-community.mustache';

const maxItems = 5;
const sources = {
	sap: {
		blogs: "https://content.services.sap.com/cse/search/user?name=jhodel18&types=blogpost&sort=published:desc&size=100&page=0",
		topBlogs: `https://content.services.sap.com/cse/search/user?name=jhodel18&types=blogpost&sort=published:desc&size=${maxItems}&page=0`
	}

};

// Return a given object, but with the date property formatted nicely
const getFormattedDate = item => {
	item.date = new Date(item.date).toDateString();
	return item;
};

const transformData = (item, index) => {
	return {
		number: index + 1,
		title: item.displayName,
		link: item.url,
		date: item.published,
		likes: item.likes,
		comments: item.comments,
		prettyUrl: item.prettyUrl,
		engaged: item.engaged
	};
};

const getSapContent = async url => {
	const response = await request('GET', url);
	const blogs = JSON.parse(response.getBody())._embedded.contents
		.map(transformData)
		.map(getFormattedDate);

	for (let blog of blogs) {
		const response = await request('GET', blog.prettyUrl);
		const root = parse(Buffer.from(response.body).toString());
		const viewsStatus = root.querySelector(".ds-social-stats >span:last-child");
		const views = viewsStatus ? viewsStatus.lastChild : 0;
		blog.views = views;
	}

	return blogs;
};

async function main() {
	const data = {
		topBlogs: await getSapContent(sources.sap.topBlogs),
		blogs: await getSapContent(sources.sap.blogs)
	};

	fs.readFile(MAIN_TEMPLATE, (err, template) => {
		if (err) throw err;
		const output = Mustache.render(template.toString(), data);
		fs.writeFileSync('README.md', output);
	});

	fs.readFile(SAP_COMMUNITY, (err, template) => {
		if (err) throw err;
		const output = Mustache.render(template.toString(), data);
		fs.writeFileSync('sap-community.md', output);
	});
}

main();