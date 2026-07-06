<template>
  <div
    class="shoe-sprite-container"
    :style="containerStyle"
  ></div>
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

const containerStyle = computed(() => {
  let col = 0
  let row = 0

  if (props.name) {
    let hash = 0
    for (let i = 0; i < props.name.length; i++) {
      hash = props.name.charCodeAt(i) + ((hash << 5) - hash)
    }
    const safeHash = Math.abs(hash)
    col = safeHash % 10 // 10 columns (0 to 9)

    // Determine row based on category (racing=rows 0-2, daily=rows 3-6, cushion=rows 7-9, trail=rows 10-12)
    let cat = props.category
    if (!cat) {
      // Infer category from name heuristics if not provided
      const nameLower = props.name.toLowerCase()
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
      row = safeHash % 3 // Rows 0-2
    } else if (cat === 'daily') {
      row = 3 + (safeHash % 4) // Rows 3-6
    } else if (cat === 'cushion') {
      row = 7 + (safeHash % 3) // Rows 7-9
    } else if (cat === 'trail') {
      row = 10 + (safeHash % 3) // Rows 10-12
    } else {
      row = safeHash % 13 // Fallback across all rows
    }
  }

  const posX = col * (100 / 9)   // 10 columns -> indices 0-9 -> 9 steps
  const posY = row * (100 / 12)  // 13 rows -> indices 0-12 -> 12 steps

  return {
    width: `${props.size}px`,
    height: `${props.size}px`,
    backgroundImage: 'url("/popular_shoes_sprite_right.jpg")',
    backgroundSize: '1000% 1300%', // 10 columns, 13 rows
    backgroundPosition: `${posX}% ${posY}%`,
    backgroundRepeat: 'no-repeat',
    borderRadius: '12px',
    backgroundColor: '#ffffff',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
  }
})
</script>

<style scoped>
.shoe-sprite-container {
  display: inline-block;
  transition: transform 0.2s ease;
}
.shoe-sprite-container:hover {
  transform: scale(1.05);
}
</style>
