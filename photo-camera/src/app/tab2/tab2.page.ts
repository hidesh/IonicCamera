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
  email: string = '';
  constructor(public photoService: PhotoService, public auth: AuthenticationService) {}
  async getUserPhotos(userId: string){
    try {
      console.log(userId)
        const userDocRef = this.auth.afStore.collection('user').doc(userId!).collection('photos').valueChanges().subscribe((data) => {
          console.log(data)
          this.photos = data
          console.log(this.photos)
        });
        return userDocRef;
    } catch (error) {
      console.error('Error getting user photos:', error);
      return null;
    }
  }
  async ngOnInit(){
    /* await this.photoService.loadSaved(); */
    try {
      this.auth.ngFireAuth.onAuthStateChanged((user) => {
        if(user){
          this.getUserPhotos(user.uid)
          this.email = user.email!;
          console.log(this.email)
        }
      })
    } catch (error) {
      console.error('Error getting user photos:', error);
    }

  }

  addPhotoToGallery() {
    this.photoService.addNewToGallery();
   }

}
