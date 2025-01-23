import { Component, inject, ViewChild } from '@angular/core';
import { Icon, LatLng, Map, Marker, Polyline, tileLayer } from 'leaflet';
import { FormBuilder, Validators, FormsModule, ReactiveFormsModule, FormGroup} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTable, MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatStepperModule } from '@angular/material/stepper';

export class Point {
  point: number;
  name: string;
  latitude: number;
  longitude: number;

  constructor(point: number, name: string, latidude: number, longitude: number)
  {
    this.point = point;
    this.name = name;
    this.latitude = latidude;
    this.longitude = longitude;
  }
}

export class Section {
  section: string;
  origin: string;
  destination: string;
  distance: number;
  time1: string; 
  course: string;
  time2: string;
  time3: string;
  consumption: number;

  constructor(section: string, origin: string, destination: string, distance: number, time1: string, course: string, time2: string, time3: string, consumption: number)
  {
    this.section = section; 
    this.origin = origin;
    this.destination = destination;
    this.distance = distance;
    this.time1 = time1;
    this.course = course;
    this.time2 = time2;
    this.time3 = time3;
    this.consumption = consumption;
  }
}

@Component({
  selector: 'app-root',
  imports: [MatFormFieldModule, 
            FormsModule, 
            ReactiveFormsModule, 
            MatFormFieldModule,
            MatInputModule,
            MatButtonModule,
            MatIconModule,
            MatTableModule,
            CommonModule,
            MatToolbarModule,
            MatStepperModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {

  //FormBuilder dependency injection
  private _fb = inject(FormBuilder);

  //Form groups
  //Data form group
  dataForm: FormGroup = this._fb.group({
    departureTimeHour: ['', [Validators.required, Validators.min(0), Validators.max(23)]],
    departureTimeMinute: ['', [Validators.required, Validators.min(0), Validators.max(59)]],
    meanVelocity: ['', [Validators.required, Validators.min(1)]],
    meanConsumption: ['', [Validators.required, Validators.min(0)]]
  });

  //Data form group
  pointForm: FormGroup = this._fb.group({
    name: ['', Validators.required],
    latitude: ['', Validators.required],
    longitude: ['', Validators.required]
  });

  //Tables
  //Table 1
  @ViewChild('table1') table1!: MatTable<Point>;
  displayedColumnsTable1: string[] = ['point', 'name', 'latitude', 'longitude', 'remove'];
  dataSourceTable1: Point[] = [];

  //Table 2
  @ViewChild('table2') table2!: MatTable<Section>;
  displayedColumnsTable2: string[] = ['section', 'origin', 'destination', 'distance', 'time1', 'course', 'time2', 'time3', 'consumption'];
  dataSourceTable2: Section[] = [];


  //Maps
  //Map1
  step2Map: Map | null = null;

  //Map2
  step3Map: Map | null = null;

  //Markers
  markerListStep2Map: Marker[] = [];
  auxMarkerStep2Map: Marker | null = null;

  //Polyline
  routePolylines: Polyline[] = [];

  //ICONS
  greyIcon: Icon = new Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-grey.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  blueIcon: Icon = new Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  constructor()
  {
  }

  ngAfterViewInit(): void {
    this.step2Map = new Map('step2map').setView([36.8513868, -5.5944967], 5);

    this.step3Map = new Map('step3map').setView([36.8513868, -5.5944967], 5);

    tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/" target="_blank">Humanitarian OpenStreetMap Team</a> hosted by <a href="https://openstreetmap.fr/" target="_blank">OpenStreetMap France</a>'
    }).addTo(this.step2Map);

    tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/" target="_blank">Humanitarian OpenStreetMap Team</a> hosted by <a href="https://openstreetmap.fr/" target="_blank">OpenStreetMap France</a>'
    }).addTo(this.step3Map);

    this.step2Map.on('click', (e: any) => 
    {
      if (this.auxMarkerStep2Map != null)
        this.step2Map?.removeLayer(this.auxMarkerStep2Map);

      this.auxMarkerStep2Map = null;

      this.auxMarkerStep2Map = new Marker([e.latlng.lat, e.latlng.lng], {icon: this.greyIcon});
      this.step2Map?.addLayer(this.auxMarkerStep2Map);
      
      this.pointForm.get('latitude')?.setValue(e.latlng.lat);
      this.pointForm.get('longitude')?.setValue(e.latlng.lng);
    });
  }

  addPoint()
  {
    //New point is created and added to the dataSource (table rows are rendered)
    let newPoint: Point = new Point(this.dataSourceTable1.length+1, this.pointForm.get('name')?.value+'', Number(this.pointForm.get('latitude')?.value), Number(this.pointForm.get('longitude')?.value));
    this.dataSourceTable1.push(newPoint);
    this.table1.renderRows();

    //New marker is created and added to the map
    let newMarker = new Marker([Number(this.auxMarkerStep2Map?.getLatLng().lat), Number(this.auxMarkerStep2Map?.getLatLng().lng)], {icon: this.blueIcon});
    newMarker.bindTooltip(this.pointForm.get('name')?.value+'');
    this.step2Map?.addLayer(newMarker);
    this.markerListStep2Map.push(newMarker);

    //Form is reset
    this.pointForm.reset();
    this.pointForm.setErrors(null);
    this.pointForm.updateValueAndValidity();
    
    //Aux marker can be removed because we've just created a new point
    if (this.auxMarkerStep2Map != null)
      this.step2Map?.removeLayer(this.auxMarkerStep2Map);

    this.auxMarkerStep2Map = null;
  }

  removePoint(element: Point)
  {
    //Removes the marker from the map
    this.step2Map?.removeLayer(this.markerListStep2Map[element.point-1]);

    //Removes the marker from the list of markers
    this.markerListStep2Map.splice(element.point-1, 1);

    //Removes the point from the list of points
    this.dataSourceTable1.splice(element.point-1, 1);

    //Reassign de point id to the rest of points
    for (let i = 0; i < this.dataSourceTable1.length; i++)
      this.dataSourceTable1[i].point = i + 1

    //Table rows are rendered
    this.table1.renderRows();
  }

  generateRoute()
  {
    let pointList: Point[] = [...this.dataSourceTable1];

    pointList.push(pointList[0]);

    let currentTime: number[] = [this.dataForm.get('departureTimeHour')?.value, this.dataForm.get('departureTimeMinute')?.value];

    let totalDistance: number = 0;
    let totalTime: number[] = [0, 0];
    let totalConsumption: number = 0;

    let latlngs = [];

    //Iteration of point list
    for (let i = 0; i < pointList.length - 1; i++)
    {
      //Gets two latLng points
      let latLng1 = new LatLng(pointList[i].latitude, pointList[i].longitude);
      let latLng2 = new LatLng(pointList[i+1].latitude, pointList[i+1].longitude);

      //Calculates the distance between previous points (km)
      let distance = (Number(this.step2Map?.distance(latLng1, latLng2)) / 1000.0);

      let time1 = currentTime[0] + ':' + (currentTime[1] < 10 ? '0' : '') + currentTime[1];

      let course = this.calculateBearing(latLng1.lat, latLng1.lng, latLng2.lat, latLng2.lng);

      let {hours, minutes} = this.dec2Time(distance / this.dataForm.get('meanVelocity')?.value);

      let time2 = hours + ':' + (minutes < 10 ? '0' : '') + minutes; 

      let destinationMinutes = (currentTime[1] + minutes) % 60;
      let destinationHours = (currentTime[0] + (hours + Math.floor( (currentTime[1] + minutes) / 60))) % 24;
      let time3 = destinationHours + ':' + (destinationMinutes < 10 ? '0' : '') + destinationMinutes;

      let consumption: number = (distance / this.dataForm.get('meanVelocity')?.value) * this.dataForm.get('meanConsumption')?.value;

      let newSection: Section = new Section((i + 1).toString(), pointList[i].name, pointList[i+1].name, distance, String(time1), course.toFixed(1).toString(), time2, String(time3), consumption);
      this.dataSourceTable2.push(newSection);

      currentTime = [destinationHours, destinationMinutes];

      //Draws polylines between points
      latlngs.push([latLng1, latLng2])
      let polyline: Polyline = new Polyline([latLng1, latLng2], {color: 'red', dashArray: '10, 10'});
      polyline.bindTooltip('Distancia: ' + distance.toFixed(2).toString() + ' km', {permanent: true});
      this.step3Map?.addLayer(polyline);
      this.routePolylines.push(polyline);

      //Calculates total variables
      totalDistance += distance;
      totalTime = [totalTime[0] + hours, totalTime[1] + minutes];
      totalConsumption += consumption;
    }

    let routePolyline = new Polyline(latlngs, {color: 'red', dashArray: '10, 10'});
    this.step3Map?.fitBounds(routePolyline.getBounds(), {animate: true, duration: 5});

    totalTime = [totalTime[0] + Math.floor(totalTime[1] / 60), (totalTime[1] % 60)]

    let newSection: Section = new Section('Total', '', '', totalDistance, '', '', totalTime[0] + ':' + (totalTime[1] < 10 ? '0' : '') + totalTime[1], '', totalConsumption);
    this.dataSourceTable2.push(newSection);

    this.table2.renderRows();
  }

  calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const toRadians = (deg: number) => (deg * Math.PI) / 180;
    const toDegrees = (rad: number) => (rad * 180) / Math.PI;

    const phi1 = toRadians(lat1);
    const lambda1 = toRadians(lon1);
    
    const phi2 = toRadians(lat2);
    const lambda2 = toRadians(lon2);

    const difflambda = lambda2 - lambda1;

    const y = Math.sin(difflambda) * Math.cos(phi2);
    const x =
      Math.cos(phi1) * Math.sin(phi2) -
      Math.sin(phi1) * Math.cos(phi2) * Math.cos(difflambda);

    const theta = Math.atan2(y, x);

    return (toDegrees(theta) + 360) % 360;
  }

  dec2Time(decimal: number): { hours: number, minutes: number } {
    const hours = Math.floor(decimal); // Parte entera del número
    const minutes = Math.round((decimal - hours) * 60); // Parte decimal convertida a minutos
    return { hours, minutes };
  }

  resetAllSteps()
  {
    //Step 3 table is reset
    this.dataSourceTable2 = [];
    this.table2.renderRows();

    //Step 3 map Polylines are deleted
    this.routePolylines.forEach((polyline) => {
      this.step3Map?.removeLayer(polyline);
    });

    this.routePolylines = [];

    //Step 2 table is reset
    this.dataSourceTable1 = [];
    this.table1.renderRows();

    //Step 2 form is reset
    this.pointForm.reset();
    this.pointForm.updateValueAndValidity();

    //Step 1 form is reset
    this.dataForm.reset();
    this.dataForm.updateValueAndValidity();
  }
}
