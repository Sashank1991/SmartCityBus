import { Directive } from "@angular/core"
import { GoogleMapsAPIWrapper } from 'angular2-google-maps/core/services/google-maps-api-wrapper';
declare var google: any;

@Directive({
    selector: '[DirectionsMapDirective]',
    inputs: ['drawComponent']
})
export class DirectionsMapDirective {
    public drawComponent: busPaths[];
    constructor(private gmapsApi: GoogleMapsAPIWrapper) { }
    ngOnInit() {
        console.log("hello");
        var obj = this.drawComponent;
        this.gmapsApi.getNativeMap().then(map => {
            var flightPlanCoordinates = [];
           for (let entry of obj) {
                var locations = entry.json_build_object.location;
                for (let dt of locations) {
                    var ts = dt.trim().split(" ");
                    var gmapPoints = {
                        lat:+ ts[1],
                        lng:+ ts[0]
                    }
                    flightPlanCoordinates.push(gmapPoints);
                }
            }

            var flightPath = new google.maps.Polyline({
                path: flightPlanCoordinates,
                geodesic: true,
                strokeColor: '#FF0000',
                strokeOpacity: 1.0,
                strokeWeight: 2
            });
            map.setOptions({ center: { lat: 37.331792, lng: -121.901918 } , zoom:15});
            flightPath.setMap(map);




        });
    }


}


interface busPaths {
    json_build_object: {
        location: string[],
        routeId: string
    }
}