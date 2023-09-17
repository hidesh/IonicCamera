import { Component, OnInit } from '@angular/core';
import { PhotoService } from '../services/photo.service';
import { AuthenticationService } from 'src/shared/authentication-service';
import { Observable, from } from 'rxjs';
@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss']
})
export class Tab2Page implements OnInit {
  photos: any[] = []; // Array to store photos
  constructor(public photoService: PhotoService) {}
  async ngOnInit(){
    /* await this.photoService.loadSaved(); */
    try {
      const userPhotosResponse = await this.photoService.getUserPhotos();

      if (Array.isArray(userPhotosResponse)) {
        this.photos = userPhotosResponse;
        console.log(this.photos);
      } else {
        console.error('Invalid response:', userPhotosResponse);
      }
    } catch (error) {
      console.error('Error getting user photos:', error);
    }

  }

  addPhotoToGallery() {
    this.photoService.addNewToGallery();
   }

}
