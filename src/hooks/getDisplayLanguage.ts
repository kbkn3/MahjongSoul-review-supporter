import { Storage } from "@plasmohq/storage";

const getDisplayLanguage = () => {
  // let DisplayLang = 0;
  // chrome.storage.local.get("DisplayLang", (result) => {
  //   // join langs
  //   if (typeof result.DisplayLang !== "undefined") {
  //      DisplayLang = result.DisplayLang;
  //   }
  // });
  // return DisplayLang;
  const storage = new Storage();
  storage.set("DisplayLang", 0)
  const DisplayLang = storage.get("DisplayLang");
  return DisplayLang;
};
export default getDisplayLanguage;
