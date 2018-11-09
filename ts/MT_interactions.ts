import { FSM } from "./FSM";
import * as transfo from "./transfo";

function multiTouch(element: HTMLElement) : void {
    let pointerId_1 : number, Pt1_coord_element : SVGPoint, Pt1_coord_parent : SVGPoint,
        pointerId_2 : number, Pt2_coord_element : SVGPoint, Pt2_coord_parent : SVGPoint,
        originalMatrix : SVGMatrix,
        getRelevantDataFromEvent = (evt : TouchEvent) : Touch => {
            for(let i=0; i<evt.changedTouches.length; i++) {
                let touch = evt.changedTouches.item(i);
                if(touch.identifier === pointerId_1 || touch.identifier === pointerId_2) {
                    return touch;
                }
            }
            return null;
        };
    enum MT_STATES {Inactive, Translating, Rotozooming}
    let fsm = FSM.parse<MT_STATES>( {
        initialState: MT_STATES.Inactive,
        states: [MT_STATES.Inactive, MT_STATES.Translating, MT_STATES.Rotozooming],
        transitions : [
            { from: MT_STATES.Inactive, to: MT_STATES.Translating,
                eventTargets: [element],
                eventName: ["touchstart"],
                useCapture: false,
                action: (evt : TouchEvent) : boolean => {

                    Pt1_coord_parent = transfo.getPoint(evt.changedTouches.item(0).pageX,evt.changedTouches.item(0).pageY );
                    originalMatrix = transfo.getMatrixFromElement(element);

                    Pt1_coord_element = Pt1_coord_parent.matrixTransform(originalMatrix.inverse());

                    return true;
                }
            },
            { from: MT_STATES.Translating, to: MT_STATES.Translating,
                eventTargets: [document],
                eventName: ["touchmove"],
                useCapture: true,
                action: (evt : TouchEvent) : boolean => {
                    evt.preventDefault();
                    evt.stopPropagation();

                    if(evt.changedTouches.item(0).identifier===1){
                     console.log("PBBBBBBBBBBBBB");
                        Pt1_coord_parent=Pt2_coord_parent;
                        Pt1_coord_element=Pt2_coord_element;
                    }
                    Pt1_coord_parent = transfo.getPoint(evt.changedTouches.item(0).pageX,evt.changedTouches.item(0).pageY );
                    transfo.drag(element,originalMatrix,Pt1_coord_element,Pt1_coord_parent);
                    console.log("DRAGGING");

                    return true;
                }
            },
            { from: MT_STATES.Translating,
                to: MT_STATES.Inactive,
                eventTargets: [document],
                eventName: ["touchend"],
                useCapture: true,
                action: (evt : TouchEvent) : boolean => {
                    console.log("INCATIVE");
                    return true;
                }
            },
            { from: MT_STATES.Translating, to: MT_STATES.Rotozooming,
                eventTargets: [element],
                eventName: ["touchstart"],
                useCapture: true,
                action: (evt : TouchEvent) : boolean => {
                    console.log("entering Rotozooming");
                    originalMatrix = transfo.getMatrixFromElement(element);
                   // Pt2_coord_element = transfo.getPoint(evt.changedTouches.item(0).pageX,evt.changedTouches.item(0).pageY );
                    Pt2_coord_parent= transfo.getPoint(evt.changedTouches.item(0).pageX,evt.changedTouches.item(0).pageY );
                    Pt2_coord_element = Pt2_coord_parent.matrixTransform(originalMatrix.inverse());
                    return true;
                }
            },
            { from: MT_STATES.Rotozooming, to: MT_STATES.Rotozooming,
                eventTargets: [document],
                eventName: ["touchmove"],
                useCapture: true,
                action: (evt : TouchEvent) : boolean => {
                    evt.preventDefault();
                    evt.stopPropagation();
                    console.log("Rotozooming");
                    if(evt.changedTouches.length===2){

                        Pt2_coord_parent = transfo.getPoint(evt.changedTouches.item(1).pageX,evt.changedTouches.item(1).pageY );
                        Pt1_coord_parent = transfo.getPoint(evt.changedTouches.item(0).pageX,evt.changedTouches.item(0).pageY );
                    }
                    else if(evt.changedTouches.length===1){
                        if(evt.changedTouches.item(0).identifier!==0){
                            Pt2_coord_parent= transfo.getPoint(evt.changedTouches.item(0).pageX,evt.changedTouches.item(0).pageY );
                        }
                    }
                    transfo.rotozoom(element,originalMatrix,Pt1_coord_element,Pt1_coord_parent,Pt2_coord_element,Pt2_coord_parent);





                    return true;
                }
            },
            { from: MT_STATES.Rotozooming,
                to: MT_STATES.Translating,
                eventTargets: [document],
                eventName: ["touchend"],
                useCapture: true,
                action: (evt : TouchEvent) : boolean => {
                    const touch = getRelevantDataFromEvent(evt);
                    console.log("entering Translating");
                    if(evt.changedTouches.item(0).identifier===0){
                        Pt1_coord_parent=Pt2_coord_parent;
                        Pt1_coord_element=Pt2_coord_element;
                        console.log("PLSLSLSLSLSLSLSLS");
                    }
                    originalMatrix = transfo.getMatrixFromElement(element);
                    return true;
                }
            }
        ]
    } );
    fsm.start();
}

//______________________________________________________________________________________________________________________
//______________________________________________________________________________________________________________________
//______________________________________________________________________________________________________________________
function isString(s : any) : boolean {
    return typeof(s) === "string" || s instanceof String;
}

export let $ = (sel : string | Element | Element[]) : void => {
    let L : Element[] = [];
    if( isString(sel) ) {
        L = Array.from( document.querySelectorAll(<string>sel) );
    } else if(sel instanceof Element) {
        L.push( sel );
    } else if(sel instanceof Array) {
        L = sel;
    }
    L.forEach( multiTouch );
};
