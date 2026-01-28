import SCard from "@/components/student/SCard";
import { CardTitle, CardDescription, CardFooter, Card, CardHeader } from "@/components/ui/card";
import { Query, Student } from "@/lib/types/data";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import { useGContext } from "@/components/ContextProvider";



export default function InfoPage() {
  const workerRef = useRef<Worker | null>(null);
const [teamMembers, setTeamMembers] = useState<Student[]>([]);
  useEffect(() => {
    if (typeof window !== "undefined" && window.Worker) {
      const worker = new Worker("workers/data_worker.js", { type: "module" });
      workerRef.current = worker;

      worker.onmessage = (event: MessageEvent) => {
        const { status, results } = event.data;
        if (status === "team_results") {
   
          setTeamMembers(results);
        }
      };

      // Fetch team if not already available
      if (teamMembers.length === 0) {
        const TEAM_ROLLS = [230626, 240539, 240669, 240876, 240980, 240981, 240979, 241118, 241211];
        worker.postMessage({ command: "get_team", payload: TEAM_ROLLS });
      }

      return () => {
        workerRef.current?.terminate();
      };
    }
  }, [teamMembers]);



   

 

 

  return (
    <div className="min-h-screen flex flex-col items-center justify-start px-6 py-12
                    bg-gradient-to-br from-black via-slate-900 to-black">


      <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-black px-6 py-16 text-white">
        <div className="mx-auto max-w-4xl">

        
          <h1 className="text-center text-4xl font-bold tracking-wide mb-12">
            Frequently Asked Questions
          </h1>

    
          <div className="space-y-8 rounded-2xl bg-white/5 backdrop-blur-xl
                    border border-white/10 shadow-xl p-8">

        
            <div>
              <h2 className="text-xl font-semibold mb-2">
                Setting a custom DP
              </h2>
              <p className="text-white/80 leading-relaxed">
                You can customize the image shown here by placing a custom image named
                <span className="font-medium text-white"> dp.jpg </span>
                or
                <span className="font-medium text-white"> dp.png </span>
                in your IITK webhome folder.
                Visiting
                <span className="block mt-1 font-mono text-sm text-white/90">
                  http://home.iitk.ac.in/~yourusername/dp
                </span>
                should display your picture.
              </p>
            </div>

            <hr className="border-white/10" />

         
            <div>
              <h2 className="text-xl font-semibold mb-2">
                I can’t see students’ pictures or access student data
              </h2>
              <p className="text-white/80 leading-relaxed">
                Access to student data is restricted to users who are currently on
                campus or connected via VPN.
                <br />
                Ensure that:
              </p>
              <ul className="list-disc ml-6 mt-2 text-white/80 space-y-1">
                <li>You are logged into your PClub account</li>
                <li>Your profile visibility is set to <b>Public</b></li>
              </ul>
            </div>

            <hr className="border-white/10" />

            {/* Cache Section */}
            <div>
              <h2 className="text-xl font-semibold mb-2">
                Changes not reflecting / App behaving unexpectedly
              </h2>
              <p className="text-white/80 leading-relaxed mb-4">
                If the app is not functioning as expected or recent updates are not
                visible, clearing the application cache usually resolves the issue.
              </p>

              <button
                onClick={() => {
          
             
                  indexedDB.deleteDatabase("students");
                  window.location.reload();
                }}
                className="inline-flex items-center gap-2
                     px-4 py-2 rounded-lg text-sm font-medium
                     bg-white/10 hover:bg-white/20
                     border border-white/20 transition"
              >
                Clear App Cache
              </button>

              <p className="text-xs text-white/60 mt-2">
                This clears locally stored data for this website only and reloads the page.
              </p>
            </div>

            <hr className="border-white/10" />

            {/* Footer */}
            <div className="text-sm text-white/70 italic text-right">
              Credit for Student Guide data (bacche, ammas and baapus) goes to the{" "}
              <a
                href="https://www.iitk.ac.in/counsel/"
                className="underline hover:no-underline text-white"
              >
                Center for Mental Health and Wellbeing, IIT Kanpur
              </a>
            </div>

          </div>
        </div>
      </div>




      <div className="w-full max-w-6xl rounded-2xl 
                       shadow-xl p-10">

        <h1 className="text-center text-4xl font-bold tracking-wide mb-10 text-white">
          2025 TEAM
        </h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 
                gap-8 place-items-center auto-rows-fr">

          {/* {teamMembers.map((student) => (
            <SCard type="big" data={student} key={student.rollNo} />
          ))} */}
        </div>
      </div>

      <p className="mt-10 text-center text-white">
        You can contribute to this project  on our GitHub repository.
        <br />
        Visit{" "}
        <a
          className="underline hover:no-underline"
          href="https://github.com/pclubiitk/compass"
          target="_blank"
          rel="noopener noreferrer"
        >
          github.com/pclubiitk/compass
        </a>{" "}
        for more details.
      </p>

    </div>
  );
}
