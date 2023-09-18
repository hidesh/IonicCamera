import { Injectable } from '@angular/core';
import {
  Camera,
  CameraResultType,
  CameraSource,
  Photo,
} from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { AuthenticationService } from 'src/shared/authentication-service';

@Injectable({ providedIn: 'root' })
export class PhotoService {
  public photos: any[] = [];
  userId: string | null = '';
  constructor(public auth: AuthenticationService) {}

  private async readAsBase64(photo: Photo) {
    const response = await fetch(photo.webPath!);
    const blob = await response.blob();
    return (await this.convertBlobToBase64(blob)) as string;
  }
  private convertBlobToBase64 = (blob: Blob) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        resolve(reader.result);
      };
      reader.readAsDataURL(blob);
    });

  private async savePicture(photo: Photo) {
    const base64Data = await this.readAsBase64(photo);

    const fileName = Date.now() + '.jpeg';
    await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Data,
    });
    return {
      filepath: fileName,
      webviewPath: photo.webPath,
      base64: base64Data,
    };
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
    const capturedPhoto = await Camera.getPhoto({
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
      quality: 50,
    });
    const savedImageFile = await this.savePicture(capturedPhoto);

    const fileName = Date.now() + '.jpeg';
    try {
      const fileRef = this.auth.afStorage.ref(`user/${user!.uid}/${fileName}`);
      await fileRef.putString(savedImageFile.base64, 'data_url');

      const imageUrl = fileRef.getDownloadURL();
      imageUrl.subscribe((url) => {
        this.addImageUrlToUserCollection(user!.uid, url);
      });
    } catch {
      console.log('error');
    }
  }
  async addImageUrlToUserCollection(userId: string, imageUrl: string) {
    console.log(imageUrl);
    try {
      await this.auth.afStore
        .collection('user')
        .doc(userId)
        .collection('photos')
        .add({
          photoUrl: imageUrl,
        });
    } catch (error) {
      console.error('Error adding image URL to Firestore:', error);
    }
  }

  async addPhotoToUserCollection(userId: string, base64ImageData: string) {
    try {
      console.log(userId);
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
}

export interface UserPhoto {
  filepath: string;
  webviewPath?: string;
}
