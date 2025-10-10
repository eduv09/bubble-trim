export interface IPoint {
    x: number;
    y: number;
}

export interface ICircle {
    radius: number;
    center: IPoint;
}

export interface IBoard {
    circles: ICircle[];
}

export interface IInterfaceData {
    circle1: ICircle;
    circle2: ICircle;
}

export interface ILine {
    start: IPoint;
    end: IPoint;
}

export interface IArc {
    circle: ICircle;
    startAngle: number;
    endAngle: number;
}
