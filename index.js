const Mustache = require('mustache');
const fs = require('fs');
const MUSTACHE_MAIN_DIR = './main.mustache';
const request = require('then-request');

const maxItems = 5;
const sources = {
    sap: `https://content.services.sap.com/cs/searches/userProfile?userName=jhodel18&objectTypes=blogpost&sort=published,desc&size=${maxItems}&page=0`
};

// Return a given object, but with the date property formatted nicely
const getFormattedDate = item => {
    item.date = new Date(item.date).toDateString();
    return item;
};

const transformData = item => {
    return {
        title: item.displayName,
        link: item.url,
        date: item.published
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
    data.sap = await getSapContent(sources.sap);
    console.log(data);

    fs.readFile(MUSTACHE_MAIN_DIR, (err, template) => {
        if (err) throw err;
        const output = Mustache.render(template.toString(), data);
        fs.writeFileSync('README.md', output);
    });
}

main();