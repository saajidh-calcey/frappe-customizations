<template>
    <div class="map-container" ref="mapContainer"></div>
</template>

<script setup>
import { onMounted, ref, watch, onBeforeUnmount } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-draw/dist/leaflet.draw.css'
import 'leaflet-draw'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'

if (typeof window !== 'undefined') {
    window.L = L
}

const props = defineProps({
    value: {
        type: [Object, String],
        default: () => ({ type: 'FeatureCollection', features: [] }),
    },
    read_only: {
        type: Boolean,
        default: false,
    },
})

const emit = defineEmits(['update:modelValue', 'change'])

const mapContainer = ref(null)
let map = null
let drawnItems = new L.FeatureGroup()
let drawControl = null
let isProgrammaticUpdate = false

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl,
    iconUrl,
    shadowUrl,
})

onMounted(() => {
    initMap()
})

onBeforeUnmount(() => {
    if (map) {
        map.remove()
    }
})

function initMap() {
    if (!mapContainer.value) return

    map = L.map(mapContainer.value).setView([0, 0], 2)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map)

    map.addLayer(drawnItems)

    setupData()
    setupControls()

    setTimeout(() => {
        map.invalidateSize()
    }, 200)
}

function setupData() {
    isProgrammaticUpdate = true
    drawnItems.clearLayers()
    let data = props.value
    if (typeof data === 'string') {
        try {
            data = JSON.parse(data)
        } catch (e) {
            console.warn('Invalid GeoJSON', e)
            data = { type: 'FeatureCollection', features: [] }
        }
    }

    if (data && data.features && data.features.length) {
        L.geoJSON(data, {
            onEachFeature: function (feature, layer) {
                drawnItems.addLayer(layer)
            },
        })
        try {
            map.fitBounds(drawnItems.getBounds())
        } catch (e) {
        }
    }
    isProgrammaticUpdate = false
}

function setupControls() {
    if (props.read_only) {
        if (drawControl) {
            map.removeControl(drawControl)
            drawControl = null
        }
        return
    }

    if (drawControl) return

    drawControl = new L.Control.Draw({
        edit: {
            featureGroup: drawnItems,
        },
        draw: {
            polygon: true,
            polyline: true,
            rectangle: true,
            circle: true,
            marker: true,
            circlemarker: false,
        },
    })
    map.addControl(drawControl)

    map.on(L.Draw.Event.CREATED, function (e) {
        drawnItems.addLayer(e.layer)
        updateValue()
    })

    map.on(L.Draw.Event.EDITED, function (e) {
        updateValue()
    })

    map.on(L.Draw.Event.DELETED, function (e) {
        updateValue()
    })
}

function updateValue() {
    if (isProgrammaticUpdate) return
    const geoJSON = drawnItems.toGeoJSON()
    const stringValue = JSON.stringify(geoJSON)
    emit('update:modelValue', stringValue)
    emit('change', stringValue)
}

watch(
    () => props.value,
    (newValue) => {
        // Basic check to avoid circular verify-loop if needed, or just re-render
        // For maps, re-rendering everything is a bit heavy but safe for correctness
        // unless we diff.
        const currentGeoJSON = JSON.stringify(drawnItems.toGeoJSON())
        const newString = typeof newValue === 'string' ? newValue : JSON.stringify(newValue)

        // loose comparison
        if (currentGeoJSON !== newString) {
            setupData()
        }
    },
    { deep: true }
)

watch(
    () => props.read_only,
    () => {
        setupControls()
    }
)
</script>

<style scoped>
.map-container {
    height: 400px;
    width: 100%;
    z-index: 0;
}
</style>
