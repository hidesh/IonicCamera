import {
  AngularFirestore,
  AngularFirestoreCollection,
  DocumentReference
} from '@angular/fire/compat/firestore';
import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { User } from './user';

@Injectable({
providedIn: 'root',
})
export class DatabaseService {
private userPostsCollection: AngularFirestoreCollection<User>;
userPosts$: Observable<User[]>;

constructor(private afs: AngularFirestore) {
  this.userPostsCollection = afs.collection<User>('user');
  this.userPosts$ = this.userPostsCollection.valueChanges({ idField: 'id' });
}
addUserPost(userPost: User): Observable<DocumentReference> {
return from(this.userPostsCollection.add(userPost));
}
}
