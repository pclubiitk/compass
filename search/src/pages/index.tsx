// Notes:
// 1. Protection against "clickjacking" attacks https://owasp.org/www-community/attacks/Clickjacking
//
// // const isIFrame = typeof window !== "undefined" && window.top === window.self;
// // const [iFrame, setIFrame] = useState(false);
// //   useEffect(() => {
// //     setIFrame(!isIFrame);
// //   }, []);
// // On mount: load the iframe stopper, need to do it this way so that static generation generates the page normally
// // (isIFrame is false when building, because typeof window is "undefined" then) but if the page is indeed an iframe, the app stops working
// // can't stop iframes the normal way (setting HTTP header to disallow them) because github pages doesn't allow you to set HTTP headers :(
// // As now we are shifting to self hosting, we are removing this check.
//
// 2. Earlier, It had the key stroke feature, press '/' and you can directly type into input
//
// // const keydownfxn = (e: any) => {
// //   if (
// //     e.key === "/" &&
// //     searchBar.current &&
// //     document.activeElement != searchBar.current
// //   ) {
// //     e.preventDefault();
// //     searchBar.current.focus();
// //   } else if (
// //     e.key === "Escape" &&
// //     document.activeElement &&
// //     document.activeElement instanceof HTMLElement
// //   ) {
// //     document.activeElement.blur();
// //   }
// // };
// // useEffect(() => {
// //   document.addEventListener("keydown", keydownfxn);
// //   return () => {
// //     document.removeEventListener("keydown", keydownfxn);
// //   };
// // }, []);
// // on mount: add / button detection to move focus to search bar
//
// 3. Earlier, after the query it was sorted according to the roll number,
// // but now elastic search does that for us according to the score
//
// // results.toSorted((a: StudentType, b: StudentType) => {
// // try {
// //     return Number(a.rollNo) > Number(b.rollNo);
// //   } catch (err) {
// //     return a.rollNo > b.rollNo;
// //   }
// // })

"use client";
import Display from "@/components/Display";
import Overlay from "@/components/ui/Overlay";
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import TreeCard from "@/components/student/TreeCard";
import SCard from "@/components/student/SCard";
import {
  Student as StudentType,
  Query as QueryType,
  Options as OptType,
} from "@/lib/types/data";
import GuestFooter from "@/components/student/Footer";
import { useGContext } from "@/components/ContextProvider";
import Options from "@/components/ui/Options";
import { UsersRound } from "lucide-react";
import { ErrorCard } from "@/components/cards/ErrorCard";
import ComingSoon from "@/components/ui/ComingSoon";

export default function Home(props: Object) {
  // [For: Worker Object] [Use a ref to hold the worker instance so it persists across re-renders]
  const workerRef = useRef<Worker>();
  // Array of Students to be rendered in the display
  const [students, setStudents]: [Array<StudentType>, Function] = useState([]);
  // Overlay on the display element state
  const [currDisp, setCurr]: [any, Function] = useState();
  // Filter Options state
  const [listOpts, setOpts]: [OptType, Function] = useState({
    batch: [],
    hall: [],
    course: [],
    dept: [],
  });

  const {
    isLoggedIn,
    profileVisibility,
    globalError,
    setGlobalLoading,
    setGlobalError,
  } = useGContext();

  // [Display Managers] - Overlay for showing info and errors
  const clearOverlay = () => {
    setCurr(undefined);
    // document.body.style.overflow = "auto"; // Hotfix
  };

  const displayElement = (element: any) => {
    clearOverlay();
    setCurr([element]);
    // document.body.style.overflow = "hidden"; // Hotfix
  };

  // Worker logic
  useEffect(() => {
    // [Browser Only]
    if (typeof window !== "undefined" && window.Worker) {
      // console.log("[Component Mounted] - Worker Initializing"); // Debug

      // Create worker instance. ( The URL is relative to public folder )
      const worker = new Worker("workers/data_worker.js", {
        type: "module",
      });
      workerRef.current = worker;

      // Listen for messages
      worker.onmessage = (event: MessageEvent) => {
        const { status, options, results, message } = event.data;
        // console.log("Message received from worker:", event.data); // Debug

        // Cases
        switch (status) {
          case "ready":
            setGlobalLoading(false);
            setOpts(options);
            // console.log("Worker Ready"); // Debug
            break;
          case "query_results":
            setStudents(results);
            break;
          case "family_tree_results":
            treeHandler(results);
            break;
          case "delete":
            // No need to inform user
            // console.log(message); // Debug
            break;
          case "error":
            setGlobalError(true);
            // console.log(message); // Debug
            break;
        }
      };

      // Unexpected error
      worker.onerror = (error) => {
        // console.error("Error occurred: ", error); // Debug
        setGlobalError(true);
      };

      // Initial command to start, only when user is logged in and profile is publicly visible
      if (isLoggedIn && profileVisibility) {
        worker.postMessage({ command: "initialize" });
      }

      // If logged in and visibility is off, Delete all data
      if (isLoggedIn && !profileVisibility) {
        worker.postMessage({ command: "delete" });
      }

      // Cleanup function
      return () => {
        // console.log("[Component UnMounted] - Terminating Worker");
        workerRef.current?.terminate();
      };
    }
  }, [isLoggedIn, profileVisibility]);

  // Whenever error any global error occurs, show the error card
  useEffect(() => {
    if (globalError) displayElement(<ErrorCard />);
  }, [globalError]);

  // [Onclick functions] Render Helper Functions
  const sendQuery = (query: QueryType) => {
    workerRef.current?.postMessage({ command: "query", payload: query });
  };

  const displayTree = (student: StudentType) => {
    clearOverlay();
    workerRef.current?.postMessage({
      command: "get_family_tree",
      payload: student,
    });
  };

  // Show user profile big card, onclick in the overlay
  const displayCard = (student: StudentType) => {
    clearOverlay();
    // document.body.style.overflow = "hidden"; // Hotfix
    setCurr([
      <SCard type={"big"} data={student} key="closed">
        <Button
          disabled={true}
          className="w-full mt-2"
          variant="outline"
          onClick={() => {
            displayTree(student);
          }}
        >
          <UsersRound className="h-4 w-4" />
          Open Family Tree
          <ComingSoon />
        </Button>
      </SCard>,
    ]);
  };

  // Render family tree
  function treeHandler(family_tree_results: any) {
    // document.body.style.overflow = "hidden"; //hotfix
    let [baapu, student, bacchas] = family_tree_results;
    setCurr([
      <TreeCard
        key="open"
        data={student}
        baapu={baapu /*TreeCard'll handle undefined*/}
        bacchas={bacchas}
        displayCard={displayCard}
        clearOverlay={clearOverlay}
      />,
      <div className="footer-absolute" key="footer">
        <GuestFooter />
      </div>,
    ]);
  }

  return (
    <div>
      <br />
      <Options sendQuery={sendQuery} listOpts={listOpts} />
      <Display
        toShow={students}
        displayCard={displayCard}
        displayInfo={displayElement}
      />
      <Overlay clearOverlay={clearOverlay}>
        {currDisp !== undefined ? currDisp : ""}
      </Overlay>
    </div>
  );
}
