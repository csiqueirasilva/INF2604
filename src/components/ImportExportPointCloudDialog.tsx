import { Button } from "@components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogOverlay, DialogTitle } from "@components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/ui/select";
import { Textarea } from "@components/ui/textarea";
import { Point3 } from "@geometry/points";
import { SampleModel } from "@geometry/sampleModel";
import { exportPointsAsText, importPointsFromMatrix, importPointsFromText } from "@helpers/export";
import { useEffect, useState } from "react";

interface Props {
    importDialogOpen: boolean,
    setImportDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
    points: Point3[],
    setPoints: React.Dispatch<React.SetStateAction<Point3[]>>;
    options: SampleModel[]
}

export default function ImportExportPointCloudDialog(props : Props) {
    const [ pointsAsText, setPointsAsText ] = useState('');
    const [ descriptionText, setDescriptionText ] = useState('');
    useEffect(() => {
        if(props.importDialogOpen) {
            const text = exportPointsAsText(props.points);
            setPointsAsText(text);
        } else {
            setPointsAsText('');
        }
        setDescriptionText('');
    }, [ props.importDialogOpen ]);
    useEffect(() => {

    }, []);
    return (
        <Dialog open={props.importDialogOpen}>
            <DialogOverlay />
            <DialogContent closeCb={() => props.setImportDialogOpen(false)}>
                <DialogHeader>
                    <DialogTitle>Import/Export pontos</DialogTitle>
                    <DialogDescription>Pontos no formato (x,y,z); um em cada linha</DialogDescription>
                </DialogHeader>
                <Select value={''} onValueChange={(value) => {
                    const cloud = props.options.find(x => x.name === value);
                    if(cloud) {
                        let points = importPointsFromMatrix(cloud.points);
                        let txt = exportPointsAsText(points);
                        setPointsAsText(txt);
                        setDescriptionText(`${cloud.name}; ${cloud.description}`);
                    } else {
                        setDescriptionText('');
                    }
                }}>
                    <SelectTrigger className="w-[100%]">
                        <SelectValue placeholder="Pré definições de nuvem de pontos..." />
                    </SelectTrigger>
                    <SelectContent>
                        {
                            props.options.map((cloud, idx) => <SelectItem key={idx} value={cloud.name}>{cloud.name}</SelectItem>)
                        }
                    </SelectContent>
                </Select>
                <div>{ descriptionText }</div>
                <Textarea className={"h-[400px] resize-none"} defaultValue={pointsAsText} onChange={(ev) => setPointsAsText(ev.target.value)} />
                <Button onClick={() => {
                    try {
                        let points = importPointsFromText(pointsAsText);
                        props.setPoints(points);
                        props.setImportDialogOpen(false);
                    } catch (e) {
                        alert(e);
                    }
                }}>Update</Button>
            </DialogContent>
        </Dialog>
    )
}