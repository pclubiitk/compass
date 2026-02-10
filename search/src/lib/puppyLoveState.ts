// Shared Puppy Love types and state
// This file contains module-level state that can be imported by both
// React components and Web Workers without circular dependencies

export interface Heart {
  sha_encrypt: string;
  id_encrypt: string;
  songID_enc: string;
}

export interface Hearts {
  heart1: Heart | null;
  heart2: Heart | null;
  heart3: Heart | null;
  heart4: Heart | null;
}

// Puppy Love module-level state
export let receiverIds: string[] = ['', '', '', ''];
export let puppyLoveHeartsSent: Hearts | null = null;
export let heartsReceivedFromMales = 0;
export let heartsReceivedFromFemales = 0;
export let puppyLoveHeartsReceived: any[] = [];

export function setPuppyLoveHeartsSent(hearts: Hearts | null) {
  puppyLoveHeartsSent = hearts;
}

export function getNumberOfHeartsSent() {
  if (!puppyLoveHeartsSent) return 0;
  return Object.values(puppyLoveHeartsSent).filter(value => value != null && value.id_encrypt !== '').length;
}

export function incHeartsMalesBy(heartsMales: number) {
  heartsReceivedFromMales += heartsMales;
}

export function addReceivedHeart(claim: any) {
  puppyLoveHeartsReceived.push(claim);
}

export function incHeartsFemalesBy(heartsFemales: number) {
  heartsReceivedFromFemales += heartsFemales;
}

export function resetReceivedHearts() {
  puppyLoveHeartsReceived.length = 0;
  heartsReceivedFromMales = 0;
  heartsReceivedFromFemales = 0;
}

export function setReceiverIds(ids: string[]) {
  // Replace contents of receiverIds in-place, maintaining 4 slots
  for (let i = 0; i < 4; i++) {
    receiverIds[i] = ids[i] ?? '';
  }
  // Trim any extra entries beyond 4
  receiverIds.length = 4;
}

export function resetPuppyLoveState() {
  puppyLoveHeartsReceived.length = 0;
  puppyLoveHeartsSent = null;
  heartsReceivedFromMales = 0;
  heartsReceivedFromFemales = 0;
  receiverIds.length = 0;
  receiverIds.push('', '', '', '');
}
