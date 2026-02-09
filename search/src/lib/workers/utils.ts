// import { Hearts, receiverIds, puppyLoveHeartsSent, incHeartsFemalesBy, incHeartsMalesBy, setPuppyLoveHeartsSent, addReceivedHeart } from "@/components/puppy-love/PuppyLoveContextProvider";
// import { Decryption } from "./Encryption";


// export async function setData(data: string, privateKey: string | null, idSelf: string) {
//     for (let i = 0; i < 4; i++) {
//         receiverIds[i] = '';
//     }

//     if (data === 'FIRST_LOGIN') {
//         return;
//     }

//     setPuppyLoveHeartsSent(JSON.parse(data) as Hearts);

//     const idEncrypts: string[] = [];
    
//     for (const key in puppyLoveHeartsSent) {
//         idEncrypts.push(puppyLoveHeartsSent[key as keyof Hearts].id_encrypt);
//     }

//     for (let i = 0; i < 4; i++) {
//         if (idEncrypts[i] === '') {
//             receiverIds[i] = '';
//             continue;
//         }
//         let id: string;
//         if (privateKey) {
//             id = await Decryption(idEncrypts[i], privateKey);
//             if (id === null || id === "Fail") {
//                 return;
//             }
//         } else {
//             return;
//         }
//         let str = id.split('-');
//         if (str[0] === idSelf) {
//             receiverIds[i] = str[1];
//         }
//         else {
//             receiverIds[i] = str[0];
//         }

//     }

// }


// interface heart {
//   enc: string;
//   sha: string;
//   genderOfSender: string;
// }

// // Return Claimed Hearts
// interface ReturnHeart {
//   enc: string;
//   sha: string;
//   songID_enc: string;
// }


// export async function setClaims(claims: string) {
//     if (claims === '') {
//         return;
//     }

//     let jsonStrings: string[];

//     if (claims.includes('+')) {
//         jsonStrings = claims.split('+');
//     } else {
//         jsonStrings = [claims];
//     }

//     jsonStrings.forEach((jsonString) => {
//         const claim = JSON.parse(decodeURIComponent(jsonString)) as heart;
        
//         if (claim.genderOfSender === 'F') {
//             incHeartsFemalesBy(1);
//         } else if (claim.genderOfSender === 'M') {
//             incHeartsMalesBy(1);
//         }

//         // Add to claimed hearts array
//         addReceivedHeart(claim);
//     });
// }