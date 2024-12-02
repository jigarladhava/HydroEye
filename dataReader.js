// dataReader.js
const fs = require('fs');

async function readLocationsFromFile() {
    try {
        const locationsData = fs.readFileSync('ph1_preload/prefix_locations.txt', 'utf8');

        // return locationsData.trim().split('\r\n');
        return locationsData.trim().split('\r\n').map(line => line.split('|')[0]);
    } catch (error) {
        console.error('Error reading locations file:', error);
        return [];
    }
}

async function readTagsFromFile(location) {
    try {


        /*   */

        const locationsData = fs.readFileSync('ph1_preload/prefix_locations.txt', 'utf8');
        const allLines = locationsData.trim().split('\r\n');

        // Find the line that starts with the given location
        const matchingLine = allLines.find(line => line.startsWith(location + '|'));

        if (matchingLine) {
            // Return the part after the `|`
            var prefix =  matchingLine.split('|')[1];
            const tagsData = fs.readFileSync(`ph1_preload/allTags.txt`, 'utf8');
            let AlltagData = tagsData.trim().split('\r\n');
            return AlltagData.filter(currenttag => currenttag.includes(prefix));

        }

        // Return null or a default value if no match is found
        return null;


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
