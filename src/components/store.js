import { defineStore } from 'pinia';

export const useMapStore = defineStore('map', {
  state: () => ({
    map: null
  }),
  actions: {
    setMap(map) {
      this.map = map;
    }
  },
  getters: {
    getMap() {
      return this.map;
    }
  },
});
