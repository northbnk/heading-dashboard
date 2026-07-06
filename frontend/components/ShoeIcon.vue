<template>
  <img
    :src="imageSrc"
    :style="{ width: size + 'px', height: size + 'px' }"
    class="shoe-illustration-image"
    alt="Shoe"
  />
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  name: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    default: ''
  },
  size: {
    type: Number,
    default: 64
  }
})

const popularModelsMap = [
  // Racing (Row 0, 1)
  { pattern: 'alphafly 3', col: 0, row: 0 },
  { pattern: 'alphafly 4', col: 0, row: 0 },
  { pattern: 'alphafly', col: 0, row: 0 },
  { pattern: 'vaporfly 3', col: 1, row: 0 },
  { pattern: 'vaporfly 4', col: 1, row: 0 },
  { pattern: 'vaporfly', col: 1, row: 0 },
  { pattern: 'adios pro 3', col: 2, row: 0 },
  { pattern: 'adios pro 4', col: 2, row: 0 },
  { pattern: 'adios pro', col: 2, row: 0 },
  { pattern: 'metaspeed sky', col: 3, row: 0 },
  { pattern: 'metaspeed edge', col: 3, row: 0 },
  { pattern: 'metaspeed', col: 3, row: 0 },
  { pattern: 'magic speed 4', col: 3, row: 0 },
  { pattern: 'magic speed 5', col: 3, row: 0 },
  { pattern: 'magic speed', col: 3, row: 0 },
  { pattern: 'sc elite v4', col: 4, row: 0 },
  { pattern: 'sc elite v5', col: 4, row: 0 },
  { pattern: 'sc elite', col: 4, row: 0 },
  { pattern: 'cielo', col: 5, row: 0 },
  { pattern: 'rocket', col: 5, row: 0 },
  { pattern: 'fast-r', col: 4, row: 1 },
  { pattern: 'phantasm', col: 5, row: 1 },

  // Pegasus
  { pattern: 'pegasus 40', col: 0, row: 2 },
  { pattern: 'pegasus 41', col: 0, row: 3 },
  { pattern: 'pegasus 42', col: 0, row: 4 },
  { pattern: 'pegasus', col: 0, row: 2 },

  // Boston
  { pattern: 'boston 12', col: 1, row: 2 },
  { pattern: 'boston 13', col: 1, row: 4 },
  { pattern: 'boston', col: 1, row: 2 },

  // Novablast
  { pattern: 'novablast 4', col: 2, row: 2 },
  { pattern: 'novablast 5', col: 2, row: 3 },
  { pattern: 'novablast 6', col: 2, row: 4 },
  { pattern: 'novablast', col: 2, row: 2 },

  // Endorphin Speed / Pro
  { pattern: 'endorphin pro', col: 3, row: 2 },
  { pattern: 'endorphin speed', col: 3, row: 4 },
  { pattern: 'endorphin', col: 3, row: 2 },

  // Rebel
  { pattern: 'rebel v4', col: 4, row: 2 },
  { pattern: 'rebel v5', col: 5, row: 1 },
  { pattern: 'rebel', col: 4, row: 2 },

  // Wave Rider
  { pattern: 'wave rider', col: 5, row: 2 },
  { pattern: 'wave inspire', col: 5, row: 2 },

  // Ghost
  { pattern: 'ghost 16', col: 4, row: 3 },
  { pattern: 'ghost 17', col: 4, row: 5 },
  { pattern: 'ghost', col: 4, row: 3 },

  // On Cloudrunner / Surfer / Flow
  { pattern: 'cloudrunner', col: 5, row: 4 },
  { pattern: 'cloudsurfer', col: 5, row: 4 },
  { pattern: 'cloudflow', col: 5, row: 4 },

  // Asics Trainers
  { pattern: 'gt-2000', col: 2, row: 5 },
  { pattern: 'cumulus', col: 3, row: 5 },

  // Saucony Ride
  { pattern: 'ride', col: 5, row: 5 },

  // Hoka Clifton
  { pattern: 'clifton 9', col: 0, row: 6 },
  { pattern: 'clifton 10', col: 0, row: 7 },
  { pattern: 'clifton', col: 0, row: 6 },

  // Hoka Bondi
  { pattern: 'bondi 8', col: 1, row: 6 },
  { pattern: 'bondi 9', col: 1, row: 7 },
  { pattern: 'bondi', col: 1, row: 6 },

  // On Cloudmonster / Cloudeclipse
  { pattern: 'cloudmonster', col: 2, row: 6 },
  { pattern: 'cloudeclipse', col: 2, row: 6 },

  // Gel-Nimbus
  { pattern: 'nimbus', col: 3, row: 6 },
  { pattern: 'glideride', col: 3, row: 6 },

  // Invincible / Vomero
  { pattern: 'invincible', col: 4, row: 6 },
  { pattern: 'vomero', col: 4, row: 6 },

  // NB 1080 / More
  { pattern: '1080', col: 5, row: 6 },
  { pattern: 'vongo', col: 5, row: 6 },
  { pattern: 'more', col: 5, row: 6 },

  // Brooks Glycerin
  { pattern: 'glycerin', col: 3, row: 7 },

  // Trail
  { pattern: 'speedgoat', col: 0, row: 8 },
  { pattern: 'sense ride', col: 1, row: 8 },
  { pattern: 'salomon', col: 1, row: 8 },
  { pattern: 'trabuco', col: 2, row: 8 },
  { pattern: 'wildhorse', col: 3, row: 8 },
  { pattern: 'kiger', col: 3, row: 8 },
  { pattern: 'zegama', col: 3, row: 8 },
  { pattern: 'lone peak', col: 4, row: 8 },
  { pattern: 'timp', col: 4, row: 8 },
  { pattern: 'peregrine', col: 5, row: 8 },
  { pattern: 'cascadia', col: 4, row: 9 },
  { pattern: 'hierro', col: 5, row: 9 },
  { pattern: 'cloudultra', col: 3, row: 10 }
]

const imageSrc = computed(() => {
  let col = 0
  let row = 0

  if (props.name) {
    let hash = 0
    for (let i = 0; i < props.name.length; i++) {
      hash = props.name.charCodeAt(i) + ((hash << 5) - hash)
    }
    const safeHash = Math.abs(hash)
    const nameLower = props.name.toLowerCase()

    // 1. Check direct matches for iconic real shoe models in the array map
    let matchedItem = popularModelsMap.find(item => nameLower.includes(item.pattern))

    if (matchedItem) {
      col = matchedItem.col
      row = matchedItem.row
    } else {
      // 2. Map other shoes to a matching category coordinate
      let cat = props.category
      if (!cat) {
        if (nameLower.includes('vapor') || nameLower.includes('alpha') || nameLower.includes('metaspeed') || nameLower.includes('adizero') || nameLower.includes('pro')) {
          cat = 'racing'
        } else if (nameLower.includes('trail') || nameLower.includes('speedgoat') || nameLower.includes('wildhorse') || nameLower.includes('trabuco')) {
          cat = 'trail'
        } else if (nameLower.includes('bondi') || nameLower.includes('invincible') || nameLower.includes('kayano') || nameLower.includes('nimbus') || nameLower.includes('cushion')) {
          cat = 'cushion'
        } else {
          cat = 'daily'
        }
      }

      cat = cat.toLowerCase()
      if (cat === 'racing') {
        // Map to racing row 0 or 1
        row = safeHash % 2
        col = safeHash % 6
      } else if (cat === 'daily') {
        // Map to daily rows 2 to 5
        row = 2 + (safeHash % 4)
        col = safeHash % 6
      } else if (cat === 'cushion') {
        // Map to cushion rows 6 to 7
        row = 6 + (safeHash % 2)
        col = safeHash % 6
      } else if (cat === 'trail') {
        // Map to trail rows 8 to 10
        row = 8 + (safeHash % 3)
        col = safeHash % 6
      } else {
        row = safeHash % 11
        col = safeHash % 6
      }
    }
  }

  return `/shoes/shoe_${row}_${col}.png`
})
</script>

<style scoped>
.shoe-illustration-image {
  display: inline-block;
  object-fit: contain;
  background-color: transparent;
  transition: transform 0.2s ease;
}
.shoe-illustration-image:hover {
  transform: scale(1.05);
}
</style>
