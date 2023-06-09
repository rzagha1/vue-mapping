<template>
  <div id="layer-control">
    <div class="layer-list">
      <div v-for="(layer, key) in layerFncs" :key="key" class="layer-item">
      <input type="checkbox" :id="key" :checked="true" v-model="layer.visible" />
      <label :for="key">{{ key.charAt(0).toUpperCase() + key.slice(1) }}</label>
      <div class="sublayer-container">
      <div class="sublayer-item" v-for="(sublayer, index) in layer.INFO" :key="index">
      <label v-if="sublayer.GEOM === 'Point'">
        <div class="point" :style="{ backgroundColor: sublayer.COLOR }"></div>
      </label>
      <label v-else-if="sublayer.GEOM === 'Polygon'">
        <div class="box" :style="{ backgroundColor: sublayer.COLOR }"></div>
      </label>
    </div>
  </div>
</div>

    </div>
  </div>
</template>

<script>
import { reactive, onMounted, watchEffect, getCurrentInstance,defineProps,watch } from 'vue';
import { useMapStore } from './store.js';

export default {
  name: 'LC',
  props: {
    url: {
      type: String,
      required: true
    }
  },
  setup(props) {
    defineProps(['url']);
    const instance = getCurrentInstance();
    const mapStore = useMapStore();
    const layerFncs = reactive({   
      us_pts: {
        INFO: [
          {
            LYR: 'public.us_points',
            ID: 'us_pts',
            REF: '7mill',
            COLOR: 'purple',
            GEOM: 'Point',
            MIN_ZOOM: 12,
            QUERY: null
          }
        ]
      },
      states:{
        INFO:[{
            LYR: 'public.us_states',
            ID: 'states',
            REF: 'state_source',
            COLOR: 'red',
            GEOM: 'Polygon',
            MIN_ZOOM: 1,
            QUERY: null
        }
        ]
      },
      hexagons:{
        INFO:[{
            LYR: 'public.hexagons',
            ID: 'hexagons',
            REF: 'hex_source',
            COLOR: 'orange',
            GEOM: 'Polygon',
            MIN_ZOOM: 1,
            QUERY: '?step=4'
        }
        ]
      }
    });

    onMounted(() => {
      const switchLayer = (layer) => {
        const layerId = layer.target.id;
        mapStore.map.setLayoutProperty(
          layerId,
          'visibility',
          layer.target.checked ? 'visible' : 'none'
        );
        if (layerFncs[layerId].INFO[0].GEOM === 'Polygon') {
          const lineLayerId = layerId + 'line';
          mapStore.map.setLayoutProperty(
            lineLayerId,
            'visibility',
            layer.target.checked ? 'visible' : 'none'
          );
        }
      };
      const inputs = document.getElementById('layer-control').getElementsByTagName('input');
      for (let i = 0; i < inputs.length; i++) {
        inputs[i].addEventListener('change', switchLayer);
      }
    watchEffect(() => {
      if (mapStore.map) {
        mapStore.map.on('load', () => {
          addLayers(mapStore.map, layerFncs);     
          instance.emit('eventsFromFncs', layerFncs);  
        });        
      }
    });

    watch(() => props.url,      
      (newValue) => {
        removeLayers(mapStore.map);
        const selectedStates = newValue.split(',').map(state => state.trim());
        if(selectedStates[0]===''){ //show all states and points
          layerFncs['states'].INFO[0].LYR= 'public.us_states';
          layerFncs['us_pts'].INFO[0].LYR= 'public.us_points';
          addPolygon(mapStore.map, layerFncs['states'].INFO[0]);
          addPoints(mapStore.map, layerFncs['us_pts'].INFO[0]);
        }
        else if (selectedStates.length === 1) {//show 1 state with points
          layerFncs['states'].INFO[0].LYR= 'public.choose_state';
          layerFncs['states'].INFO[0].QUERY=`?state=${newValue}`;
          layerFncs['us_pts'].INFO[0].LYR= 'public.choose_pt';
          layerFncs['us_pts'].INFO[0].QUERY=`?in_state=${newValue}`;
          layerFncs['us_pts'].INFO[0].MIN_ZOOM=1;
          addPolygon(mapStore.map, layerFncs['states'].INFO[0]);
          addPoints(mapStore.map, layerFncs['us_pts'].INFO[0]);
        }
        else{ //show multiple chosen states with corresponding points
          layerFncs['states'].INFO[0].LYR= 'public.choose_states';
          layerFncs['states'].INFO[0].QUERY= `?states=${selectedStates.join(",")}`;
          layerFncs['us_pts'].INFO[0].LYR= 'public.choose_pts';
          layerFncs['us_pts'].INFO[0].QUERY= `?in_states=${selectedStates.join(",")}`;
          layerFncs['us_pts'].INFO[0].MIN_ZOOM=1;
          addPolygon(mapStore.map, layerFncs['states'].INFO[0]);
          addPoints(mapStore.map, layerFncs['us_pts'].INFO[0]);
        }
      }
    );
    });
    return {
      layerFncs
    };
  }
};

function addPolygon(map, layer) {
  const tilesUrl = layer.QUERY ? `http://localhost:7800/${layer.LYR}/{z}/{x}/{y}.pbf${layer.QUERY}` : `http://localhost:7800/${layer.LYR}/{z}/{x}/{y}.pbf`;
  map.addSource(layer.REF, {
    type: 'vector',
    tiles: [tilesUrl],
    minzoom: layer.MIN_ZOOM,
    maxzoom: 22,
    promoteId: 'id'
  });
  map.addLayer({
    id: layer.ID + 'line',
    source: layer.REF,
    'source-layer': layer.LYR,
    type: 'line',
    paint: {
      'line-color': layer.COLOR,
      'line-width': 1
    }
  });
  map.addLayer({
    id: layer.ID,
    source: layer.REF,
    'source-layer': layer.LYR,
    type: 'fill',
    layout: {
      visibility: 'visible'
    },
    paint: {
      'fill-color': layer.COLOR,
      'fill-opacity': [
        'case',
        ['boolean', ['feature-state', 'hover'], false],
        1,
        0.5
      ]
    }
  });
}

function addPoints(map, layer) {
  const tilesUrl = layer.QUERY ? `http://localhost:7800/${layer.LYR}/{z}/{x}/{y}.pbf${layer.QUERY}` : `http://localhost:7800/${layer.LYR}/{z}/{x}/{y}.pbf`;
  map.addSource(layer.REF, {
    type: 'vector',
    tiles: [tilesUrl],
    minzoom: layer.MIN_ZOOM,
    maxzoom: 22,
    promoteId: 'id',
  });
  map.addLayer({
    id: layer.ID,
    type: 'circle',
    source: layer.REF,
    'source-layer': layer.LYR,
    paint: {
      'circle-color': layer.COLOR,
      'circle-radius': 3,
      'circle-stroke-width': 1,
      'circle-stroke-color': 'white'
    }
  });  
}

function addLayers(map, layerFncs) {
  for (const key in layerFncs) {
    const layer = layerFncs[key];
    const geometryType = layer.INFO[0].GEOM;
    if (geometryType === 'Polygon') {
      addPolygon(map, layer.INFO[0]);
    } else if (geometryType === 'Point') {
      addPoints(map, layer.INFO[0]);
    }
  }
}
function removeLayers(map){
  if (map.getLayer('states')) {
      map.removeLayer('states');
  }
  if (map.getLayer('statesline')) {
    map.removeLayer('statesline');
  }
  if (map.getSource('state_source')) {
    map.removeSource('state_source');
  }
  if (map.getLayer('us_pts')){
    map.removeLayer('us_pts');
  }
  if (map.getSource('7mill')){
    map.removeSource('7mill');
  }
}
</script>
  
  <style>
  .box {
  display: inline-block;
  width: 20px;
  height: 17px;
  border: 1px solid black;
  vertical-align: middle;
  margin-left: 7px;
  border-radius: 3px;
}

.point {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-left: 7px;
  background-color: #000;
}

#layer-control {
  position: absolute;
  bottom: 10px;
  left: 10px;
  z-index: 1;
  border-radius: 10px;
  border: none;
  background-color: #F3F3F3;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.25);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  color: #333333;
}

#layer-control h2 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: bold;
  padding: 1rem;
  border-bottom: 1px solid #CCCCCC;
}

.layer-list {
  max-height: 400px;
  overflow-y: auto;
  padding: 1rem;
}

.layer-item {
  display: flex;
  align-items: center;
  padding: 0.5rem;
  border-radius: 3px;
}

.layer-item:hover {
  background-color: #EEEEEE;
  cursor: pointer;
}

.layer-item input[type="checkbox"] {
  margin-right: 0.5rem;
  width: 28px;
  height: 28px;
  appearance: none;
  border: 3px solid;
  border-radius: 50%;
  outline: none;
  transition: all 0.3s;
  position: relative;
  background-color: white;
}


.layer-item input[type="checkbox"]::before {
  content: "";
  display: block;
  height: 70%;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border-radius: 3px;
  transition: all 0.3s;
  background-color: lightyellow;
}

.layer-item input[type="checkbox"]:checked::before {
  content: "✓";
  display: block;
  font-size: 1.2rem;
  position: absolute;
  transform: translate(-50%, -50%);
  color: black;
  transition: all 0.3s;
  text-align: center;
  line-height: .8;
  border: none;
}


.layer-item label {
  font-size: 1rem; /* reduced font size */
  font-weight: bold;
  cursor: pointer;
}

.layer-item .layer-color {
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  margin-right: 0.5rem;
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);
}

.layer-item input[type="checkbox"]:checked + label .layer-color {
  box-shadow: 0 0 0 5px rgba(0, 0, 0, 0.1);
}

.sublayer-container {
  display: flex;
  flex-wrap: wrap;
  margin-top: 0.5rem;
}

.sublayer-item {
  display: flex;
  align-items: center;
  margin-right: 0.5rem;
  margin-bottom: 0.5rem;
}
  </style>
  