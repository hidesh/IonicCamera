import {Injectable} from '@angular/core';
import {Camera, CameraResultType, CameraSource, Photo} from '@capacitor/camera'
import {Filesystem, Directory} from '@capacitor/filesystem'
import {Preferences} from '@capacitor/preferences';
import { AuthenticationService } from 'src/shared/authentication-service';

@Injectable({providedIn: 'root'})
export class PhotoService {
    public photos : UserPhoto[] = [];
    private PHOTO_STORAGE: string = 'photos';
    constructor(public auth: AuthenticationService) {}
    
    private async readAsBase64(photo : Photo) {
        const response = await fetch(photo.webPath !);
        const blob = await response.blob();
        return await this.convertBlobToBase64(blob)as string;
    }
    private convertBlobToBase64 = (blob : Blob) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = reject;
        reader.onload = () => {
            resolve(reader.result);
        };
        reader.readAsDataURL(blob);
    });

    private async savePicture(photo : Photo) {
        const base64Data = await this.readAsBase64(photo);
        
        const fileName = Date.now() + '.jpeg';
        await Filesystem.writeFile({path: fileName, data: base64Data, directory: Directory.Data});
        return {filepath: fileName, webviewPath: photo.webPath, base64: base64Data}

    }

   /*  public async loadSaved() {
      const { value } = await Preferences.get({ key: this.PHOTO_STORAGE });
      this.photos = (value ? JSON.parse(value) : []) as UserPhoto[];
      for (let photo of this.photos) {
        const readFile = await Filesystem.readFile({
        path: photo.filepath,
        directory: Directory.Data,
        });
        photo.webviewPath = `data:image/jpeg;base64,${readFile.data}`;
       } 
    } */

    public async addNewToGallery() {
        const user = await this.auth.ngFireAuth.currentUser;
        const capturedPhoto = await Camera.getPhoto({resultType: CameraResultType.Uri, source: CameraSource.Camera, quality: 100});
        const savedImageFile = await this.savePicture(capturedPhoto);
        console.log("imagefile",savedImageFile)
        this.photos.unshift(savedImageFile)
        Preferences.set({
          key: this.PHOTO_STORAGE,
          value: JSON.stringify(this.photos),
         })
        this.addPhotoToUserCollection(user!.uid,savedImageFile.base64)
    }

    async addPhotoToUserCollection(userId: string, base64ImageData: string) {
        try {
          const userDocRef = this.auth.afStore.collection('user').doc(userId);
            await userDocRef.collection('photos').add({
              imageUrl: base64ImageData,
              timestamp: new Date().getTime(),
            });
          } catch (error) {
          console.error('Error adding photo to Firestore:', error);
          throw error;
        }
      }

      async getUserPhotos() {
        try {
          const user = await this.auth.ngFireAuth.currentUser;
          
          if (user) {
            const ret = this.auth.afStore
              .collection(`user/${user.uid}/photos`)
              .valueChanges();
      
            console.log(ret);
            return ret;
          } else {
            console.error('User is not authenticated.');
            // Handle the case where the user is not authenticated
            return [];
          }
        } catch (error) {
          console.error('Error getting user photos:', error);
          // Handle the error
          return null;
        }
      }


}

export interface UserPhoto {
    filepath: string;
    webviewPath?: string;
}
