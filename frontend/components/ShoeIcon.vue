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

const popularModelsMap = {
  // Racing (Row 0)
  'alphafly': { col: 0, row: 0 },
  'vaporfly': { col: 1, row: 0 },
  'adios pro': { col: 2, row: 0 },
  'metaspeed': { col: 3, row: 0 },
  'magic speed': { col: 3, row: 0 },
  'sc elite': { col: 4, row: 0 },
  // Trainers (Row 1)
  'pegasus': { col: 0, row: 1 },
  'boston': { col: 1, row: 1 },
  'novablast': { col: 2, row: 1 },
  'endorphin': { col: 3, row: 1 },
  'deviate nitro': { col: 4, row: 1 },
  'velocity nitro': { col: 4, row: 1 },
  // Cushion (Row 2)
  'clifton': { col: 0, row: 2 },
  'bondi': { col: 1, row: 2 },
  'cloudmonster': { col: 2, row: 2 },
  'nimbus': { col: 3, row: 2 },
  '1080': { col: 3, row: 2 },
  'invincible': { col: 4, row: 2 },
  // Trail (Row 3)
  'speedgoat': { col: 0, row: 3 },
  'salomon': { col: 1, row: 3 },
  'sense ride': { col: 1, row: 3 },
  'trabuco': { col: 2, row: 3 },
  'wildhorse': { col: 3, row: 3 },
  'lone peak': { col: 4, row: 3 },
  'timp': { col: 4, row: 3 }
}

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

    // 1. Check direct matches for iconic real shoe models
    let matchedKey = null
    for (const key in popularModelsMap) {
      if (nameLower.includes(key)) {
        matchedKey = key
        break
      }
    }

    if (matchedKey) {
      col = popularModelsMap[matchedKey].col
      row = popularModelsMap[matchedKey].row
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
        const racingCoords = [
          { col: 0, row: 0 }, // Alphafly
          { col: 1, row: 0 }, // Vaporfly
          { col: 2, row: 0 }, // Adizero Pro
          { col: 3, row: 0 }, // Metaspeed
          { col: 4, row: 0 }  // SC Elite
        ]
        const coord = racingCoords[safeHash % racingCoords.length]
        col = coord.col
        row = coord.row
      } else if (cat === 'daily') {
        const dailyCoords = [
          { col: 0, row: 1 }, // Pegasus
          { col: 1, row: 1 }, // Boston
          { col: 2, row: 1 }, // Novablast
          { col: 3, row: 1 }, // Endorphin Speed
          { col: 4, row: 1 }  // Puma Deviate
        ]
        const coord = dailyCoords[safeHash % dailyCoords.length]
        col = coord.col
        row = coord.row
      } else if (cat === 'cushion') {
        const cushionCoords = [
          { col: 0, row: 2 }, // Clifton
          { col: 1, row: 2 }, // Bondi
          { col: 2, row: 2 }, // Cloudmonster
          { col: 3, row: 2 }, // Nimbus
          { col: 4, row: 2 }  // Invincible
        ]
        const coord = cushionCoords[safeHash % cushionCoords.length]
        col = coord.col
        row = coord.row
      } else if (cat === 'trail') {
        const trailCoords = [
          { col: 0, row: 3 }, // Speedgoat
          { col: 1, row: 3 }, // Salomon
          { col: 2, row: 3 }, // Trabuco
          { col: 3, row: 3 }, // Wildhorse
          { col: 4, row: 3 }  // Lone Peak
        ]
        const coord = trailCoords[safeHash % trailCoords.length]
        col = coord.col
        row = coord.row
      } else {
        col = safeHash % 5
        row = safeHash % 5
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
  background-color: #ffffff;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s ease;
  padding: 6px;
}
.shoe-illustration-image:hover {
  transform: scale(1.05);
}
</style>
