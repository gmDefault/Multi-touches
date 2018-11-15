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
                    console.log("entering Translating");
                    // when a first finger press the screen, we store its position in Pt1
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
                    console.log("DRAGGING");
                    evt.preventDefault();
                    evt.stopPropagation();
                    //save the new position of the finger
                    Pt1_coord_parent = transfo.getPoint(evt.changedTouches.item(0).pageX,evt.changedTouches.item(0).pageY );
                    //apply the transformation : translation
                    transfo.drag(element,originalMatrix,Pt1_coord_element,Pt1_coord_parent);
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
                    // we could have set Pt1 and Pt2 to null, but it is not necessary.
                    return true;
                }
            },
            { from: MT_STATES.Translating, to: MT_STATES.Rotozooming,
                eventTargets: [element],
                eventName: ["touchstart"],
                useCapture: true,
                action: (evt : TouchEvent) : boolean => {
                    console.log("entering Rotozooming");
                    // when the other finger press the screen, we save its position and strat rotozooming
                    originalMatrix = transfo.getMatrixFromElement(element);
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
                    //if both points are moving
                    if(evt.changedTouches.length===2){
                        Pt2_coord_parent = transfo.getPoint(evt.changedTouches.item(1).pageX,evt.changedTouches.item(1).pageY );
                        Pt1_coord_parent = transfo.getPoint(evt.changedTouches.item(0).pageX,evt.changedTouches.item(0).pageY );
                    }
                    //if just one point is moving
                    else if(evt.changedTouches.length===1){
                        if(evt.changedTouches.item(0).identifier!==0){
                            Pt2_coord_parent= transfo.getPoint(evt.changedTouches.item(0).pageX,evt.changedTouches.item(0).pageY );
                        }
                    }
                    //apply the transformation (rotate, drag, zoom)
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
                    // if a finger is released, we will continue and dragging with the other finger ! 
                    // we have to set the first point (Pt1) with the coord of the remaining finger
                    if(evt.changedTouches.item(0).identifier===0){
                        Pt1_coord_parent=Pt2_coord_parent;
                        Pt1_coord_element=Pt2_coord_element;
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
