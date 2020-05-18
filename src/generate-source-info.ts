import { getAll, loadLocal } from 'destiny2-manifest/node';
import { sortObject, uniqAndSortArray, writeFile } from './helpers';

import categories from '../data/sources/categories.json';
import { objectSearchValues } from './generate-missing-collectible-info';
import stringifyObject from 'stringify-object';

interface Categories {
  sources: Record<
    string,
    {
      includes: string[];
      excludes?: string[];
      items?: string[];
      alias?: string;
    }
  >;
  exceptions: any[];
}

loadLocal();
const inventoryItems = getAll('DestinyInventoryItemDefinition');
const collectibles = getAll('DestinyCollectibleDefinition');

/*================================================================================================================================*\
||
|| categorizeSources()
|| converts manifest's sourceHashes and sourceStrings into DIM filters according to categories.json rules
||
\*================================================================================================================================*/

const newSource: Record<number, string> = {};

collectibles.forEach(function (collectible) {
  const hash = collectible.sourceHash;
  const sourceName = collectible.sourceString
    ? collectible.sourceString
    : collectible.displayProperties.description;
  if (hash) {
    // Only add sources that have an existing hash (eg. no classified items)
    newSource[hash] = sourceName;
  }
});

writeFile('./output/sources.json', newSource);
categorizeSources();

function categorizeSources() {
  let sourcesInfo: Record<number, string> = {};
  let D2Sources: Record<
    string,
    {
      itemHashes: number[];
      sourceHashes: number[];
    }
  > = {}; // converts search field short source tags to item & source hashes

  // sourcesInfo built from manifest collectibles
  collectibles.forEach((collectible) => {
    if (collectible.sourceHash) {
      sourcesInfo[collectible.sourceHash] = collectible.sourceString;
    }
  });

  // add any manual source strings from categories.json
  (categories as Categories).exceptions.forEach(([sourceHash, sourceString]) => {
    sourcesInfo[sourceHash] = sourceString;
  });

  // loop through categorization rules
  Object.entries(categories.sources).forEach(([sourceTag, matchRule]) => {
    // initialize this source's object
    D2Sources[sourceTag] = {
      itemHashes: [],
      sourceHashes: [],
    };

    // string match this category's source descriptions
    D2Sources[sourceTag].sourceHashes = objectSearchValues(sourcesInfo, matchRule);
    if (!D2Sources[sourceTag].sourceHashes.length) {
      console.log(`no matching sources for: ${matchRule}`);
    }

    // add individual items if available for this category
    if ((categories as Categories).sources[sourceTag].items) {
      (categories as Categories).sources[sourceTag].items?.forEach((itemNameOrHash) => {
        Object.entries(inventoryItems).forEach(([itemHash, itemProperties]) => {
          if (
            itemNameOrHash == itemHash ||
            itemProperties.displayProperties.name == itemNameOrHash
          ) {
            D2Sources[sourceTag].itemHashes.push(Number(itemHash));
          }
        });
        D2Sources[sourceTag].itemHashes = uniqAndSortArray(D2Sources[sourceTag].itemHashes);
      });
    }

    // lastly add aliases and copy info
    const alias = (categories as Categories).sources[sourceTag].alias;
    if (alias) {
      D2Sources[alias] = D2Sources[sourceTag];
    }
  });

  // sort the object after adding in the aliases
  const D2SourcesSorted = sortObject(D2Sources);

  let pretty = `const D2Sources: { [key: string]: { itemHashes: number[]; sourceHashes: number[] } } = ${stringifyObject(
    D2SourcesSorted,
    {
      indent: '  ',
    }
  )};\n\nexport default D2Sources;`;

  // annotate the file with sources or item names next to matching hashes
  let annotated = pretty.replace(/'(\d{2,})',?/g, (match, submatch) => {
    if (sourcesInfo[submatch]) {
      return `${Number(submatch)}, // ${sourcesInfo[submatch]}`;
    }
    if (inventoryItems[submatch]) {
      return `${Number(submatch)}, // ${inventoryItems[submatch].displayProperties.name}`;
    }
    console.log(`unable to find information for hash ${submatch}`);
    return `${Number(submatch)}, // could not identify hash`;
  });

  writeFile('./output/source-info.ts', annotated);
}
