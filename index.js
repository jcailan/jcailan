const Mustache = require('mustache');
const fs = require('fs');
const request = require('then-request');

const MAIN_TEMPLATE = './main.mustache';
const SAP_COMMUNITY = './sap-community.mustache';

const maxItems = 5;
const sources = {
    sap: {
        blogs: "https://content.services.sap.com/cs/searches/userProfile?userName=jhodel18&objectTypes=blogpost&sort=published,desc&page=0",
        topBlogs: `https://content.services.sap.com/cs/searches/userProfile?userName=jhodel18&objectTypes=blogpost&sort=published,desc&size=${maxItems}&page=0`
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
        engaged: item.engaged
    };
};

const getSapContent = async url => {
    const response = await request('GET', url);
    return JSON.parse(response.getBody())._embedded.contents
        .map(transformData)
        .map(getFormattedDate);
};

/**
 * DATA is the object that contains all
 * the data to be provided to Mustache
 * Notice the "name" and "date" property.
 */
let data = {
    name: 'Jhodel',
    date: new Date().toLocaleDateString('en-GB', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        timeZoneName: 'short',
        timeZone: 'Europe/Stockholm',
    }),
};

async function main() {
    data.topBlogs = await getSapContent(sources.sap.topBlogs);
    data.blogs = await getSapContent(sources.sap.blogs);

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