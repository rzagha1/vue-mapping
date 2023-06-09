<template>
  <div class="map-wrap">
    <a href="https://www.maptiler.com" class="watermark">
      <img src="https://api.maptiler.com/resources/logo.svg" alt="MapTiler logo" />
    </a>
    <div class="map" ref="mapContainer"></div>
    <Sidebar @selection-changed="updateUrl" />    
    <LC @eventsFromFncs="mapEvents" :url="url" />
  </div>  
</template>

<script>
import { ref, onMounted, onUnmounted, markRaw, toRaw, watch } from 'vue';
import { Map, NavigationControl, GeolocateControl, Popup } from 'maplibre-gl';
import { useMapStore } from './store.js';
import Sidebar from './Sidebar.vue';
import LC from './LayerControl.vue'

export default {
  name: 'Map',
  components: {
    Sidebar,
    LC
  },

  setup() {
    const mapStore = useMapStore();
    const mapContainer = ref(null);
    const apiKey = 'mx0LZnxQmee0xEQSHpKj';
    const hoveredFeature = ref(null);
    const popup = ref(null);
    const map = ref(null);
    const layerFncs = ref([]);
    const url = ref('');

    function featureHtml(f) {
      let html = '';
      let properties = f.properties;
      for (let key in properties) {
        html += `<b>${key}:</b> ${properties[key]}<br/>`;
      }
      return `<p>${html}</p>`;
    }

    const updateUrl = (selection) => {
      url.value = `${selection}`;
    };

    const initializeMap = () => {
      if (apiKey == null) {
        throw new Error("You need to configure env VUE_APP_API_KEY first, see README");
      }
      const initialState = { lng: -94, lat: 40, zoom: 3 };
      map.value = markRaw(
        new Map({
          container: mapContainer.value, style: `https://api.maptiler.com/maps/streets/style.json?key=${apiKey}`,
           center: [initialState.lng, initialState.lat], zoom: initialState.zoom,
        })
      );
      mapStore.setMap(map.value);
      map.value.on('load', () => {
        map.value.addControl(new NavigationControl(), 'top-left');
        map.value.addControl( new GeolocateControl({ positionOptions: { enableHighAccuracy: true }, trackUserLocation: true,}), 'top-left' );
      });
    };

    const mapEvents = (l) => {     
      layerFncs.value=toRaw(l);     
      for (const layer in layerFncs.value) {
        map.value.on('mousemove', layerFncs.value[layer].INFO[0]['ID'], (e) => {
          if (e.features.length > 0) {
            if (hoveredFeature.value) {
              map.value.getCanvas().style.cursor = '';
            }
            hoveredFeature.value = e.features[0];
            map.value.getCanvas().style.cursor = 'pointer';
            if (popup.value) {
              popup.value.remove();
            }
            popup.value = new Popup()
              .setLngLat(e.lngLat)
              .setHTML(featureHtml(hoveredFeature.value))
              .addTo(map.value);
          }
        });
        map.value.on('mouseleave',layerFncs.value[layer].INFO[0]['ID'], () => {
          if (hoveredFeature.value) {
            map.value.getCanvas().style.cursor = '';
          }
          hoveredFeature.value = null;
          map.value.getCanvas().title = '';
          map.value.getCanvas().style.cursor = '';
          if (popup.value) {
            popup.value.remove();
            popup.value = null;
          }
        });
      }
    };

    onMounted(async () => {
      initializeMap();
      await new Promise((resolve) => {        
        const unwatch = watch(layerFncs, (newValue) => {
          if (newValue !== null) {
            mapEvents(newValue);
            unwatch(); // Stop watching layerFncs after it's populated
            resolve();
          }
        });
      });
    });

    onUnmounted(() => {
      mapStore.setMap(null);
    });

    return {
      mapContainer,
      mapEvents,
      updateUrl,
      url
   };
  },
};
</script>

<style scoped>
@import '~maplibre-gl/dist/maplibre-gl.css';
.map-wrap {
  position: relative;
  width: 100%;
  height: 100vh; /* calculate height of the screen minus the heading */
}
.map {
  position: absolute;
  width: 100%;
  height: 100%;
}
.watermark {
  position: absolute;
  left: 10px;
  bottom: 10px;
  z-index: 999;
}
</style>
