/*================================================================================================================================*\
||
|| Helper Functions
||
||
\*================================================================================================================================*/
import { execSync } from 'child_process';
import seasonInfo from '../data/seasons/d2-season-info.js';
import { writeFileSync } from 'fs';

export function getCurrentSeason() {
  let seasonDate: Date;
  const maxSeasons = Object.keys(seasonInfo).length;
  const today = new Date(Date.now());
  for (let i = maxSeasons; i > 0; i--) {
    seasonDate = new Date(`${seasonInfo[i].releaseDate}T${seasonInfo[i].resetTime}`);
    seasonDate.setDate(seasonDate.getDate() - 1);
    if (today >= seasonDate) {
      return seasonInfo[i].season;
    }
  }
  return 0;
}

// export function getMostRecentManifest() {
//   const isDirectory = (source:string) => lstatSync(source).isDirectory();
//   const getDirectories = (source:string) =>
//     readdirSync(source)
//       .map((name) => join(source, name))
//       .filter(isDirectory);
//   const getFiles = (source:string) => readdirSync(source).map((name) => join(source, name));

//   let manifestDirs = getDirectories('./manifests');

//   let latest = manifestDirs[manifestDirs.length - 1];
//   let manifest = getFiles(latest);
//   return manifest[manifest.length - 1];
// }

export function writeFile(filename: string, data: any, pretty = true) {
  if (typeof data === 'object') {
    data = JSON.stringify(data, null, 2);
  }
  writeFileSync(filename, data + '\n', 'utf8');
  if (pretty) {
    execSync(`yarn prettier -c "${filename}" --write`);
  }
  console.log(`${filename} saved.`);
}

export function uniqAndSortArray(array: any[]) {
  return [...new Set(array)].sort();
}

export function diffArrays(all: any[], exclude: any[]) {
  return [
    ...new Set(
      all.filter(function (x) {
        if (!exclude.includes(x)) {
          return true;
        } else {
          return false;
        }
      })
    ),
  ];
}

export function sortObject<T extends Record<string, any>>(o: T): T {
  const sorted: Record<string, any> = {};
  const a = Object.keys(o).sort();

  for (const key of a) {
    sorted[key] = o[key];
  }

  return sorted as T;
}
