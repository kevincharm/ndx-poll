import { Camera } from '@babylonjs/core/Cameras/camera'
import { UniversalCamera } from '@babylonjs/core/Cameras/universalCamera'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { Scene } from '@babylonjs/core/scene'

export class IsometricCamera extends UniversalCamera {
    constructor(name: string, position: Vector3, scene: Scene) {
        super(name, position, scene)

        this.mode = Camera.ORTHOGRAPHIC_CAMERA
        this._scene.onPointerObservable.add((eventData) => {
            switch (eventData.type) {
                case 8:
                    this.handleMouseWheel(eventData.event as WheelEvent)
                    break
                default:
            }
        })

        this._scene.onBeforeRenderObservable.add(this.resizeCameraAspect)
    }

    private handleMouseWheel = (event: WheelEvent) => {
        const { deltaY } = event
        const zoomAmount = 5
        if (deltaY < 0) {
            // down motion, zoom out
            this.orthoTop! -= zoomAmount
        } else {
            // up motion, zoom in
            this.orthoTop! += zoomAmount
        }
    }

    /**
     * As we only adjust orthoTop, we must run this function before every render
     * to adjust orthoLeft, orthoRight, orthoBottom for the viewport's current aspect ratio.
     */
    private resizeCameraAspect = () => {
        const canvas = this._scene.getEngine().getRenderingCanvas()
        if (!canvas) {
            return
        }
        const { width, height } = canvas

        const aspectRatio = width / height
        const zoom = this.orthoTop!
        const newWidth = zoom * aspectRatio
        this.orthoLeft = -Math.abs(newWidth)
        this.orthoRight = newWidth
        this.orthoBottom = -Math.abs(zoom)
    }
}
