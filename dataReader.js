// dataReader.js
const fs = require('fs');

async function readLocationsFromFile() {
    try {
        const locationsData = fs.readFileSync('ph1_preload/locations.txt', 'utf8');
        return locationsData.trim().split('\r\n');
    } catch (error) {
        console.error('Error reading locations file:', error);
        return [];
    }
}

async function readTagsFromFile(location) {
    try {
        const tagsData = fs.readFileSync(`ph1_preload/allTags.txt`, 'utf8');
        let AlltagData = tagsData.trim().split('\r\n');
        return AlltagData.filter(currenttag => currenttag.includes(location));
    } catch (error) {
        console.error('Error reading tags file for location', location, ':', error);
        return [];
    }
}

async function readTagsFromPCTFile(location) {
    try {
        const tagsData = fs.readFileSync(`ph1_preload/allTagswithPCT.txt`, 'utf8');
        let AlltagData = tagsData.trim().split('\r\n');
        return AlltagData.filter(currenttag => currenttag.includes(location));
    } catch (error) {
        console.error('Error reading tags file for location', location, ':', error);
        return [];
    }
}

module.exports = {
    readLocationsFromFile,
    readTagsFromFile, readTagsFromPCTFile
};
