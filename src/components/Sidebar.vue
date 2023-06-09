<template>
    <div class="container">
      <div class="sidebar">
        <div class="dropdown">
          <label for="state"><b>State(s) Selected</b></label>
          <div class="selected-options">{{ getStateLabel }}</div>
          <select v-model="selectedOptions" @change="onSelectionChanged" multiple>
            <option value="">All States</option>
          <option v-for="option in options" :key="option" :value="option">{{ option }}</option>
          </select>
        </div>
        <div class="dropdown">
          <label for="speed">Speed</label>
          <select id="speed">
            <option value="speed1">Speed 1</option>
            <option value="speed2">Speed 2</option>
            <option value="speed3">Speed 3</option>
          </select>
        </div>
        <div class="dropdown">
          <label for="funds">Funds</label>
          <select id="funds">
            <option value="fund1">Fund 1</option>
            <option value="fund2">Fund 2</option>
            <option value="fund3">Fund 3</option>
          </select>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import { ref, computed } from 'vue';
  
  export default {
    name: 'Sidebar',
    setup(props, { emit }) {
      const selectedOptions = ref([]);
      const options = [
        'Alabama',
        'Alaska',
        'Arizona',
        'Arkansas',
        'California',
        'Colorado',
        'Connecticut',
        'Delaware',
        'District of Columbia',
        'Florida',
        'Georgia',
        'Hawaii',
        'Idaho',
        'Illinois',
        'Indiana',
        'Iowa',
        'Kansas',
        'Kentucky',
        'Louisiana',
        'Maine',
        'Maryland',
        'Massachusetts',
        'Michigan',
        'Minnesota',
        'Mississippi',
        'Missouri',
        'Montana',
        'Nebraska',
        'Nevada',
        'New Hampshire',
        'New Jersey',
        'New Mexico',
        'New York',
        'North Carolina',
        'North Dakota',
        'Ohio',
        'Oklahoma',
        'Oregon',
        'Pennsylvania',
        'Puerto Rico',
        'Rhode Island',
        'South Carolina',
        'South Dakota',
        'Tennessee',
        'Texas',
        'Utah',
        'Vermont',
        'Virginia',
        'Washington',
        'West Virginia',
        'Wisconsin',
        'Wyoming'
      ];
  
      const onSelectionChanged = () => {
        emit('selection-changed', selectedOptions.value);
      };

      const getStateLabel = computed(() => {
      if (selectedOptions.value.length === 0) {
        return 'All States';
      } else if (selectedOptions.value.length === 1) {
        return selectedOptions.value[0];
      } else {
        return `${selectedOptions.value}`;
      }
    });
 
      return {
        selectedOptions,
        onSelectionChanged,
        options,
        getStateLabel
      };
    }
  };
  </script>
  
  <style scoped>
  .container {
    display: flex;
  }
  
  .sidebar {
    width: 200px;
    background-color: #f1f1f1;
    padding: 20px;
    right: 0;
    position: absolute;
  }  
  
  .dropdown label {
    display: block;
    margin-bottom: 5px;
  }
  
  .dropdown select {
    width: 100%;
    padding: 5px;
    border: 1px solid #ccc;
    border-radius: 4px;
    background-color: white;
  }
  .dropdown select:focus {
    outline: none;
    box-shadow: 0 0 5px #c8c8c8;
  }
  .selected-options {
  /* Add CSS properties to handle long text */
  word-wrap: break-word; /* or use overflow-wrap: break-word; for modern browsers */
  max-width: 100%; /* Adjust the maximum width as needed */
}
  </style>
  