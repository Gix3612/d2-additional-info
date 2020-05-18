import { getAll, loadLocal } from 'destiny2-manifest/node';

import { writeFile } from './helpers';

loadLocal();
const inventoryItems = getAll('DestinyInventoryItemDefinition');
const records = getAll('DestinyRecordDefinition');

const debug = false || process.env.CI;
// e.g. 'Complete Crucible Triumph "The Stuff of Myth."';

const objectiveToTriumphHash: Record<number, Number> = {};

Object.values(inventoryItems).forEach((item) => {
  const objectiveHash = item.hash;
  const description = item.displayProperties.description;
  var match;
  if (
    item.itemCategoryHashes &&
    item.itemCategoryHashes.includes(16) && // make sure this is a quest step bc some emblems track objectives as well (2868525743)
    /complet.+triumph/i.test(description) && // instructs you to complete a triumph
    (match = description.match(/"\W*(\w[^"]+\w)\W*"/)) // proceed if a triumph name was matched
  ) {
    const triumphName = match[1];
    if (debug) {
      console.log(`found \`${triumphName}\``);
    }
    Object.values(records).forEach(function (triumph) {
      if (triumphName === triumph.displayProperties.name) {
        objectiveToTriumphHash[objectiveHash] = triumph.hash;
      }
    });
  }
});

writeFile('./output/objective-triumph.json', objectiveToTriumphHash);
