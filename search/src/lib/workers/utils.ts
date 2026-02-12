import { Hearts, puppyLoveHeartsSent, incHeartsFemalesBy, incHeartsMalesBy, setPuppyLoveHeartsSent, addReceivedHeart, puppyLoveHeartsReceived, receiverIds } from "@/lib/puppyLoveState";
import { Decryption, Encryption } from "./Encryption";


export async function setData(data: string, privateKey: string | null, idSelf: string): Promise<string[]> {
    const decryptedReceiverIds: string[] = ['', '', '', ''];

    if (data === 'FIRST_LOGIN') {
        return decryptedReceiverIds;
    }

    // Parse the hearts data and set the module-level state so getNumberOfHeartsSent() works in worker context
    let hearts: Hearts | null = null;
    try {
        hearts = JSON.parse(data) as Hearts;
    } catch (e) {
        console.error("Failed to parse hearts data in worker:", e);
        return decryptedReceiverIds;
    }

    const idEncrypts: string[] = [];
    
    for (const key in hearts) {
        const heart = hearts[key as keyof Hearts];
        idEncrypts.push(heart?.id_encrypt ?? '');
    }

    for (let i = 0; i < 4; i++) {
        if (idEncrypts[i] === '') {
            decryptedReceiverIds[i] = '';
        continue;
        }
        let id: string;
        if (privateKey) {
            id = await Decryption(idEncrypts[i], privateKey);
            if (id === null || id === "Fail") {
                return decryptedReceiverIds;
            }
        } else {
            return decryptedReceiverIds;
        }
        let str = id.split('-');
        if (str[0] === idSelf) {
            decryptedReceiverIds[i] = str[1];
        }
        else {
            decryptedReceiverIds[i] = str[0];
        }

    }

    // console.log("Decrypted Receiver IDs:", decryptedReceiverIds);
    return decryptedReceiverIds;
}


interface heart {
  enc: string;
  sha: string;
  genderOfSender: string;
}

// Return Claimed Hearts
interface ReturnHeart {
  enc: string;
  sha: string;
  songID_enc: string;
}


export async function setClaims(claims: string) {
    if (claims === '') {
        return;
    }

    let jsonStrings: string[];

    if (claims.includes('+')) {
        jsonStrings = claims.split('+');
    } else {
        jsonStrings = [claims];
    }
    let claimsArray: heart[] = [];
    jsonStrings.forEach((jsonString) => {
        const claim = JSON.parse(decodeURIComponent(jsonString)) as heart;
        
        if (claim.genderOfSender === 'F') {
            incHeartsFemalesBy(1);
        } else if (claim.genderOfSender === 'M') {
            incHeartsMalesBy(1);
        }

        // Add to claimed hearts array
        claimsArray.push(claim);
    });
    return claimsArray;
}

export async function returnHeartsHandler(puppyLovePublicKeys: any) {
    let returnHearts: ReturnHeart[] = [];
    for (const claim of puppyLoveHeartsReceived) {
        const sha  = claim.sha;
        for (let j = 0; j < 4; j++) {
            if (receiverIds[j] === '') {
                continue;
            }
            const receiverPubKey = puppyLovePublicKeys[receiverIds[j]];
            const enc = await Encryption(sha, receiverPubKey);
            const returnHeart: ReturnHeart = {
                enc,
                sha,
                songID_enc: claim.songID_enc,
            };
            returnHearts.push(returnHeart);
        }
    }
    return returnHearts;
}