import { get, getAll, loadLocal } from 'destiny2-manifest/node';

import { writeFile } from './helpers';

loadLocal();
const inventoryItems = getAll('DestinyInventoryItemDefinition');

// this is keyed with record hashes, and the values are catalyst inventoryItem icons
// (more interesting than the all-identical icons on catalyst triumphs)
const triumphIcons: Record<string, string> = {};

// loop the catalyst section of triumphs
get('DestinyPresentationNodeDefinition', 1111248994)?.children.presentationNodes.forEach((p) =>
  get('DestinyPresentationNodeDefinition', p.presentationNodeHash)?.children.records.forEach(
    (r) => {
      const recordName = get('DestinyRecordDefinition', r.recordHash)?.displayProperties.name;

      // look for an inventoryItem with the same name, and tierType 6 (should find the catalyst for that gun)
      const itemWithSameName = inventoryItems.find(
        (i) => i.displayProperties.name === recordName && i.inventory.tierType === 6
      );

      // and get its icon image
      const icon = itemWithSameName?.displayProperties?.icon;

      // this "if" check is because of classified data situations
      if (icon) triumphIcons[r.recordHash] = icon;
      else console.log(`no catalyst image found for ${r.recordHash} ${recordName}`);
    }
  )
);

writeFile('./output/catalyst-triumph-icons.json', triumphIcons);
