import { Component, inject, ViewChild } from '@angular/core';
import { Icon, LatLng, LatLngBounds, Map, Marker, Polyline, tileLayer } from 'leaflet';
import { FormBuilder, Validators, FormsModule, ReactiveFormsModule, FormGroup} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTable, MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { MatTabsModule } from '@angular/material/tabs';


import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'

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
  course: number;
  time2: string;
  time3: string;
  consumption: number;

  constructor(section: string, origin: string, destination: string, distance: number, time1: string, course: number, time2: string, time3: string, consumption: number)
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
            MatStepperModule,
            MatTimepickerModule,
            MatTabsModule],
  providers: [provideNativeDateAdapter(), {provide: MAT_DATE_LOCALE, useValue: 'es-ES'}],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {

  app_version: string = "v0.3"

  //FormBuilder dependency injection
  private _fb = inject(FormBuilder);

  //Form groups
  //Data form group
  dataForm: FormGroup = this._fb.group({
    departureTime: ['', [Validators.required]],
    meanVelocity: [160, [Validators.required, Validators.min(80)]],
    meanConsumption: [15, [Validators.required, Validators.min(0)]]
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
  step2MapEnabled: boolean = false;

  //Map2
  step3Map: Map | null = null;
  step3MapEnabled: boolean = false;
  latLngBounds: LatLngBounds | null = null;

  //Markers
  markerListStep2Map: Marker[] = [];
  markerListStep3Map: Marker[] = [];
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

  //Stepper
  @ViewChild('stepper') stepper!: MatStepper;
  currentStep: number = 1;

  //Total
  totalDistance: number = 0;
  totalTime: number[] = [0, 0];
  totalConsumption: number = 0;

  private readonly API_KEY: string = '468038a48373daad42321ffa40df8ede';

  constructor()
  {
  }

  ngAfterViewInit(): void {
    this.step2Map = new Map('step2map').setView([36.8513868, -5.5944967], 7);

    this.step3Map = new Map('step3map').setView([36.8513868, -5.5944967], 7);

    tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/" target="_blank">Humanitarian OpenStreetMap Team</a> hosted by <a href="https://openstreetmap.fr/" target="_blank">OpenStreetMap France</a>'
    }).addTo(this.step2Map);

    tileLayer('https://{s}.api.tiles.openaip.net/api/data/openaip/{z}/{x}/{y}.png?apiKey=${this.API_KEY}', {
      maxZoom: 19,
      attribution: '<a href="https://www.openaip.net/">openAIP Data</a>(<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-NC-SA</a>)'
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
      
      this.pointForm.get('latitude')?.setValue(e.latlng.lat.toFixed(4));
      this.pointForm.get('longitude')?.setValue(e.latlng.lng.toFixed(4));
    });

    //TODO: QUITAR ANTES DEL DESPLIEGUE

    //Test step 2
    // this.dataForm.get('departureTime')?.setValue(new Date(2025, 1, 31, 10, 0, 0, 0));
    // this.currentStep = 2;
    // this.stepper.next();

    // this.dataSourceTable1.push(new Point(1, 'LETF', 36.8719, -5.6489))
    // this.dataSourceTable1.push(new Point(1, 'Lebrija', 36.8960, -6.0396))
    // this.dataSourceTable1.push(new Point(1, 'Utrera', 37.1825, -5.7818))

    // this.table1.renderRows();

    // this.markerListStep2Map.push(new Marker([36.8719, -5.6489], {icon: this.blueIcon}).bindTooltip('LETF'));
    // this.markerListStep2Map.push(new Marker([36.8960, -6.0396], {icon: this.blueIcon}).bindTooltip('Lebrija'));
    // this.markerListStep2Map.push(new Marker([37.1825, -5.7818], {icon: this.blueIcon}).bindTooltip('Utrera'));

    // this.markerListStep2Map.forEach((marker) => {
    //   this.step2Map?.addLayer(marker);
    // });
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

  getFormattedTimeFromDate(date: number[])
  {
    let timeString: string = date[0] + ':' + (date[1] < 10 ? '0' : '') + date[1];
    return timeString;
  }

  generateRoute()
  {
    let pointList: Point[] = [...this.dataSourceTable1];

    pointList.push(pointList[0]);

    let departureTime: Date = this.dataForm.get('departureTime')?.value;
    let currentTime: number[] = [departureTime.getHours(), departureTime.getMinutes()];

    this.totalDistance = 0;
    this.totalTime = [0, 0];
    this.totalConsumption = 0;

    let latlngs = [];

    //Iteration of point list
    for (let i = 0; i < pointList.length - 1; i++)
    {
      //Gets two latLng points
      let latLng1 = new LatLng(pointList[i].latitude, pointList[i].longitude);
      let latLng2 = new LatLng(pointList[i+1].latitude, pointList[i+1].longitude);

      //Calculates the distance between previous points (km)
      let distance = (Number(this.step2Map?.distance(latLng1, latLng2)) / 1000.0);

      //Gets the time1 string from the current time
      let time1 = this.getFormattedTimeFromDate(currentTime);

      //Calculates the bearing between two latLng points
      let course = this.calculateBearing(latLng1.lat, latLng1.lng, latLng2.lat, latLng2.lng);

      //Gets the hours and minutes for the current section, and stringify them
      let {hours, minutes} = this.dec2Time(distance / this.dataForm.get('meanVelocity')?.value);
      let time2 = this.getFormattedTimeFromDate([hours, minutes]); 

      //Calculates the arrival time
      let destinationMinutes = (currentTime[1] + minutes) % 60;
      let destinationHours = (currentTime[0] + (hours + Math.floor( (currentTime[1] + minutes) / 60))) % 24;
      let time3 = this.getFormattedTimeFromDate([destinationHours, destinationMinutes]);

      //Calculates the consumption for the current section
      let consumption: number = (distance / this.dataForm.get('meanVelocity')?.value) * this.dataForm.get('meanConsumption')?.value;

      //Creates a new section an adds it to the section data source
      let newSection: Section = new Section((i + 1).toString(), pointList[i].name, pointList[i+1].name, this.round(distance), String(time1), this.round(course), time2, String(time3), consumption);
      this.dataSourceTable2.push(newSection);

      //Draws polylines between points
      latlngs.push([latLng1, latLng2])
      let polyline: Polyline = new Polyline([latLng1, latLng2], {color: 'red', dashArray: '10, 10'});
      polyline.bindTooltip('Distancia: ' + distance.toFixed(2).toString() + ' km', {permanent: true});
      this.step3Map?.addLayer(polyline);
      this.routePolylines.push(polyline);

      //Calculates total variables
      this.totalDistance += distance;
      this.totalTime = [this.totalTime[0] + hours, this.totalTime[1] + minutes];
      this.totalConsumption += consumption;

      //Updates the current time
      currentTime = [destinationHours, destinationMinutes];
    }

    this.totalDistance = this.round(this.totalDistance);

    //For each marker in the step 2 map, one for step 3 map is created and saved
    this.markerListStep2Map.forEach((marker) => {
      let newMarker: Marker = new Marker(marker.getLatLng(), {icon: this.blueIcon}).bindTooltip(marker.getTooltip()?.getContent()+'');
      this.step3Map?.addLayer(newMarker);
      this.markerListStep3Map.push(newMarker);
    });

    //Sets the step 3 map bounds to the bounds of a polyline built from all the sections
    let routePolyline = new Polyline(latlngs);
    this.latLngBounds = routePolyline.getBounds();
    this.step3Map?.fitBounds(this.latLngBounds);

    this.totalTime = [this.totalTime[0] + Math.floor(this.totalTime[1] / 60), (this.totalTime[1] % 60)]

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

  resetStep2()
  {
    //Step 2 table is reset
    this.dataSourceTable1 = [];
    this.table1.renderRows();

    //Step 2 form is reset
    this.pointForm.reset();
    this.pointForm.updateValueAndValidity();

    //Step 2 map markers are deleted
    this.markerListStep2Map.forEach((marker) => {
      this.step2Map?.removeLayer(marker);
    });

    if (this.auxMarkerStep2Map != null)
      this.step2Map?.removeLayer(this.auxMarkerStep2Map);

    //Map view is set to default
    this.step2Map?.setView([36.8513868, -5.5944967], 6);
  }

  resetStep3()
  {
    //Step 3 table is reset
    this.dataSourceTable2 = [];
    this.table2.renderRows();

    //Step 3 map markers are deleted
    this.markerListStep3Map.forEach((marker) => {
      this.step3Map?.removeLayer(marker);
    });

    //Step 3 map Polylines are deleted
    this.routePolylines.forEach((polyline) => {
      this.step3Map?.removeLayer(polyline);
    });

    this.routePolylines = [];
  }

  resetAllSteps()
  {
    this.resetStep2();
    this.resetStep3();

    //Step 1 form is reset
    this.dataForm.reset();
    this.dataForm.updateValueAndValidity();

    this.currentStep = 1;
  }

  increaseCurrentStep()
  {
    this.currentStep++;
  }

  decreaseCurrentStep()
  {
    this.currentStep--;
  }

  downloadPdf() {
    const doc = new jsPDF();
    autoTable(doc, { html: '#table2' });
    doc.save('ruta.pdf');
  }

  recencerViewStep2Map()
  {
    this.step2Map?.setView([36.8513868, -5.5944967], 6, {animate: true, duration: 1});
  }

  recencerViewStep3Map()
  {
    if (this.latLngBounds != null)
      this.step3Map?.fitBounds(this.latLngBounds);
  }

  round(num: number)
  {
    if ((num - Math.floor(num)) < 0.5)
      return Math.floor(num);
    else
      return Math.ceil(num);
  }
}
