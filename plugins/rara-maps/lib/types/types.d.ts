// make this file a module so `--isolatedModules`/some setups are happy
export {};

declare global {
  interface RaraMapsData {
    baseUrl: string;
    // add other known properties here
    [key: string]: any;
  }

  // global variable available at runtime
  // If it's attached to window, you can also use `interface Window` instead:
  // interface Window { raraMapsData: RaraMapsData }
  const raraMapsData: RaraMapsData;
}
