import React from "react";
import SCard from "@/components/student/SCard";
import { Card, CardDescription } from "@/components/ui/card";
import { Student } from "@/lib/types/data";

interface TreeCardProps {
  baapu?: Student;
  bacchas: Array<Student>;
  data: Student;
  displayCard: Function;
  clearOverlay?: Function;
}

function TreeCard(props: TreeCardProps) {
  return (
    <div className="tree-view">
      {props.baapu != undefined ? (
        <SCard
          pointer={true}
          type={"child"}
          data={props.baapu}
          onClick={() => {
            props.displayCard(props.baapu);
          }}
        />
      ) : (
        <Card className="p-1">
          <CardDescription>Not Available :(</CardDescription>
        </Card>
      )}
      <SCard
        pointer={true}
        type={"self"}
        data={props.data}
        onClick={() => {
          props.displayCard(props.data);
        }}
      />
      <div className="bacchas">
        {props.bacchas.length > 0
          ? props.bacchas.map((el) => (
              <SCard
                pointer={true}
                type={"normal"}
                data={el}
                key={el.rollNo}
                onClick={(e) => {
                  // Unsure about its use, neither this class exists
                  // //smoothly scroll to top
                  // document
                  //   .getElementsByClassName("MuiModal-root")[0]
                  //   .scrollTo(0, 0);
                  props.displayCard(el);
                }}
              />
            ))
          : ""}
      </div>
    </div>
  );
}

export default TreeCard;
