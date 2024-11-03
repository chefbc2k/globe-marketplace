declare module 'globe.gl' {
  export interface GlobeInstance {
    // Basic configuration
    width: (width: number) => GlobeInstance
    height: (height: number) => GlobeInstance
    backgroundColor: (color: string) => GlobeInstance
    globeImageUrl: (url: string) => GlobeInstance
    bumpImageUrl: (url: string) => GlobeInstance
    backgroundImageUrl: (url: string) => GlobeInstance

    // Atmosphere
    showAtmosphere: (show: boolean) => GlobeInstance
    atmosphereColor: (color: string) => GlobeInstance
    atmosphereAltitude: (altitude: number) => GlobeInstance

    // Points
    pointsData: (data: any[]) => GlobeInstance
    pointColor: (color: string | ((obj: any) => string)) => GlobeInstance
    pointAltitude: (altitude: number | ((obj: any) => number)) => GlobeInstance
    pointRadius: (radius: number | ((obj: any) => number)) => GlobeInstance
    pointLabel: (label: string | ((obj: any) => string)) => GlobeInstance

    // Hexbins
    hexBinPointsData: (data: any[]) => GlobeInstance
    hexBinPointWeight: (weight: string | ((obj: any) => number)) => GlobeInstance
    hexBinResolution: (resolution: number) => GlobeInstance
    hexMargin: (margin: number) => GlobeInstance
    hexTopColor: (color: string | ((obj: any) => string)) => GlobeInstance
    hexSideColor: (color: string | ((obj: any) => string)) => GlobeInstance
    hexBinColor: (color: string | ((obj: any) => string)) => GlobeInstance

    // Heatmap
    heatmapsData: (data: any[]) => GlobeInstance
    heatmapWeight: (weight: string | ((obj: any) => number)) => GlobeInstance
    heatmapColorScale: (scale: (t: number) => string) => GlobeInstance

    // Custom layer
    customLayerData: (data: any[]) => GlobeInstance
    customThreeObject: (obj: any | ((obj: any) => THREE.Object3D)) => GlobeInstance
    customThreeObjectUpdate: (updateFn: (obj: THREE.Object3D, data: any) => void) => GlobeInstance

    // Arcs
    arcsData: (data: any[]) => GlobeInstance
    arcColor: (color: string | ((obj: any) => string)) => GlobeInstance
    arcAltitude: (altitude: number | ((obj: any) => number)) => GlobeInstance
    arcStroke: (stroke: number | ((obj: any) => number)) => GlobeInstance
    arcDashLength: (length: number | ((obj: any) => number)) => GlobeInstance
    arcDashGap: (gap: number | ((obj: any) => number)) => GlobeInstance
    arcDashAnimateTime: (time: number | ((obj: any) => number)) => GlobeInstance

    // Labels
    labelsData: (data: any[]) => GlobeInstance
    labelLat: (lat: number | ((obj: any) => number)) => GlobeInstance
    labelLng: (lng: number | ((obj: any) => number)) => GlobeInstance
    labelText: (text: string | ((obj: any) => string)) => GlobeInstance
    labelSize: (size: number | ((obj: any) => number)) => GlobeInstance
    labelDotRadius: (radius: number | ((obj: any) => number)) => GlobeInstance
    labelColor: (color: string | ((obj: any) => string)) => GlobeInstance
    labelResolution: (resolution: number) => GlobeInstance

    // Controls
    controls: () => {
      autoRotate: boolean
      autoRotateSpeed: number
      update: () => void
    }

    // Camera
    pointOfView: (pov: { lat: number; lng: number; altitude: number }) => GlobeInstance
    getCoords: (lat: number, lng: number, alt: number) => { x: number; y: number; z: number }

    // Events
    onHexBinHover: (callback: (hex: any) => void) => GlobeInstance
    onHexBinClick: (callback: (hex: any) => void) => GlobeInstance
    onCustomLayerHover: (callback: (obj: any) => void) => GlobeInstance
    onCustomLayerClick: (callback: (obj: any) => void) => GlobeInstance
    onLabelHover: (callback: (label: any) => void) => GlobeInstance
    onLabelClick: (callback: (label: any) => void) => GlobeInstance
  }

  export default function createGlobe(): (container: HTMLElement) => GlobeInstance
}
