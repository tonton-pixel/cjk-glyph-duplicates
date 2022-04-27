//
// You'll need Node.js <https://nodejs.org> installed on your computer in order to run this script.
// From a terminal:
// $ cd [working directory containing this script and the associated data files]
// $ node create-duplicates-html-file.js
// Warning: takes about five minutes to complete...
//
const fs = require ('fs');
const path = require ('path');
//
const { collections, sequences } = require ('./ivd-2020-data.json');
//
const pages = require ('./svg-pages-2020.json');
//
function getSequenceRange (collection, ivs)
{
    let result = null;
    let [ base, vs ] = ivs;
    let value = (base.codePointAt (0) * (2**24)) + vs.codePointAt (0);
    let collectionPages = pages[collection];
    for (let page of collectionPages)
    {
        let firstValue = (page.first[0] * (2**24)) + page.first[1];
        let lastValue = (page.last[0] * (2**24)) + page.last[1];
        if ((value >= firstValue) && (value <= lastValue))
        {
            result = { collection, range: page.range, page: page.page };
            break;
        }
    }
    return result;
}
//
let start = new Date ();
//
let duplicates = { };
//
let lastPath = "";
let svg;
//
for (let collection in collections)
{
    for (let sequence in sequences)
    {
        let dataURLs = [ ];
        let ivses = [ ];
        let ivsArray = sequences[sequence];
        for (let ivsElement of ivsArray)
        {
            if (ivsElement.collection === collection)
            {
                let sequenceRange = getSequenceRange (ivsElement.collection, ivsElement.ivs);
                let svgPath = path.join (__dirname, 'svg-glyphs-2020', collection, `${sequenceRange.range}.svg`);
                if (svgPath !== lastPath)
                {
                    svg = fs.readFileSync (svgPath, { encoding: 'utf8' });
                    lastPath = svgPath;
                }
                let pattern = `<symbol id="${ivsElement.ivs}" viewBox="0 0 128 128"><image width="128" height="128" href="(.*?)"/></symbol>`;
                dataURLs.push (svg.match (new RegExp (pattern, 'ui'))[1]);
                ivses.push (ivsElement.ivs);
            }
        }
        if ((dataURLs.length > 1) && (dataURLs.length !== (new Set (dataURLs)).size))
        {
            console.log (`${collection}: U+${sequence.codePointAt (0).toString (16).toUpperCase ()}`, sequence);
            if (!(collection in duplicates))
            {
                duplicates[collection] = { };
            }
            duplicates[collection][sequence] = [ ];
            for (let index = 0; index < dataURLs.length; index++)
            {
                duplicates[collection][sequence].push ({ ivs: ivses[index], dataURL: dataURLs[index] });
            }
        }
    }
}
//
let htmlText =
`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>IVS glyph duplicates</title>
    <style>
        body
        {
            font-family: sans-serif;
            margin-left: 2em;
        }
        table
        {
            border-collapse: collapse;
            border: 1px solid gray;
            margin-bottom: 2em;
        }
        table tr
        {
            border: 1px solid gray;
        }
        table th,
        table td
        {
            border: 1px solid gray;
            text-align: center;
            padding: 0.5em;
        }
        table td img.image
        {
            width: 96px;
            height: 96px;
        }
        table th span.ivs,
        table td span.vs
        {
            font-family: monospace;
            font-size: larger;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <h2>IVS glyph duplicates</h2>
    {{duplicates}}
</body>
</html>
`;
let stringArray = [ ];
for (let collection in duplicates)
{
    stringArray.push (`<h3>${collection} Collection</h3>`);
    for (let character in duplicates[collection])
    {
        stringArray.push (`<table>`);
        stringArray.push (`<tr><th colspan="${duplicates[collection][character].length}"><span class="ivs">U+${character.codePointAt (0).toString (16).toUpperCase ()} ${character}</span></th></tr>`);
        stringArray.push (`<tr>`);
        for (let ivs of duplicates[collection][character])
        {
            stringArray.push (`<td><img class="image" src="${ivs.dataURL}"></td>`);
        }
        stringArray.push (`</tr>`);
        stringArray.push (`<tr>`);
        for (let ivs of duplicates[collection][character])
        {
            let [ base, vs ] = ivs.ivs;
            stringArray.push (`<td>`);
            // stringArray.push (`U+${base.codePointAt (0).toString (16).toUpperCase ()} `);
            stringArray.push (`<span class="vs">U+${vs.codePointAt (0).toString (16).toUpperCase ()}</span>`);
            stringArray.push (`</td>`);
        }
        stringArray.push (`</tr>`);
        stringArray.push (`</table>`);
    }
};
//
fs.writeFileSync (path.join (__dirname, 'IVS glyph duplicates.html'), htmlText.replace ('{{duplicates}}', stringArray.join ("")));
//
let stop = new Date ();
console.log (`Processed in ${((stop - start) / 1000).toFixed (2)} seconds`);
//
