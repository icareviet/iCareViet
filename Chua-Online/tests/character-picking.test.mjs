import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {pickCharacter} from '../src/character-picking.js';

test('character selection returns the hit identity before ground movement and respects walls',()=>{
  const avatar=new T.Group();avatar.userData.characterId='visitor';avatar.add(new T.Mesh(new T.BoxGeometry(1,2,1),new T.MeshBasicMaterial()));avatar.position.set(0,1,-5);avatar.updateMatrixWorld(true);
  const ray=new T.Raycaster(new T.Vector3(0,1,0),new T.Vector3(0,0,-1),0,40);assert.equal(pickCharacter(ray,[avatar]),'visitor');
  const wall=new T.Mesh(new T.BoxGeometry(4,4,.5),new T.MeshBasicMaterial());wall.position.set(0,1,-2);wall.updateMatrixWorld(true);assert.equal(pickCharacter(ray,[avatar],[wall]),null);assert.equal(ray.far,40);
  wall.visible=false;assert.equal(pickCharacter(ray,[avatar],[wall]),'visitor');avatar.visible=false;assert.equal(pickCharacter(ray,[avatar]),null);
});
