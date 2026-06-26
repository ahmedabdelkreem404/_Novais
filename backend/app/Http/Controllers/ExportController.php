<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Course;
use Illuminate\Support\Facades\Auth;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Str;

class ExportController extends Controller
{
    public function exportPdf($courseId)
    {
        $user = Auth::user();
        $query = Course::with('lessons');
        
        if ($user->role !== 'admin') {
            $query->where('user_id', $user->id);
        }

        $course = $query->findOrFail($courseId);
        
        $pdf = Pdf::loadView('exports.course_pdf', compact('course', 'user'));
        return $pdf->download(Str::slug($course->title) . '.pdf');
    }

    public function exportPpt($courseId)
    {
        $user = Auth::user();
        $query = Course::with('lessons');

        if ($user->role !== 'admin') {
            $query->where('user_id', $user->id);
        }

        $course = $query
            ->where(function ($courseQuery) use ($courseId) {
                $courseQuery->where('id', $courseId)
                    ->orWhere('public_id', $courseId);
            })
            ->firstOrFail();

        if (!class_exists(\ZipArchive::class)) {
            return response()->json(['message' => 'PPT export requires the PHP zip extension'], 500);
        }

        $filename = Str::slug($course->title ?: 'course') . '.pptx';
        $path = storage_path('app/' . uniqid('course-export-', true) . '.pptx');

        $zip = new \ZipArchive();
        if ($zip->open($path, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) !== true) {
            return response()->json(['message' => 'Unable to create PPT export'], 500);
        }

        $slides = $this->buildSlides($course);
        $this->addPptxFiles($zip, $slides);
        $zip->close();

        return response()->download($path, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        ])->deleteFileAfterSend(true);
    }

    private function buildSlides(Course $course): array
    {
        $slides = [[
            'title' => $course->title ?: 'Course',
            'body' => $course->description ?: 'NOVAIS course export',
        ]];

        foreach ($course->lessons as $lesson) {
            $slides[] = [
                'title' => $lesson->title ?: 'Lesson',
                'body' => $this->plainText($lesson->content ?: $lesson->topic_title ?: ''),
            ];
        }

        return array_slice($slides, 0, 30);
    }

    private function plainText(string $value): string
    {
        $value = strip_tags($value);
        $value = preg_replace('/[#*_>`\[\]\(\)-]+/', ' ', $value) ?? $value;
        $value = preg_replace('/\s+/', ' ', $value) ?? $value;

        return trim(Str::limit($value, 900, '...'));
    }

    private function addPptxFiles(\ZipArchive $zip, array $slides): void
    {
        $zip->addFromString('[Content_Types].xml', $this->contentTypesXml(count($slides)));
        $zip->addFromString('_rels/.rels', $this->rootRelsXml());
        $zip->addFromString('ppt/presentation.xml', $this->presentationXml(count($slides)));
        $zip->addFromString('ppt/_rels/presentation.xml.rels', $this->presentationRelsXml(count($slides)));
        $zip->addFromString('ppt/slideMasters/slideMaster1.xml', $this->slideMasterXml());
        $zip->addFromString('ppt/slideMasters/_rels/slideMaster1.xml.rels', $this->slideMasterRelsXml());
        $zip->addFromString('ppt/slideLayouts/slideLayout1.xml', $this->slideLayoutXml());
        $zip->addFromString('ppt/slideLayouts/_rels/slideLayout1.xml.rels', $this->slideLayoutRelsXml());
        $zip->addFromString('ppt/theme/theme1.xml', $this->themeXml());
        $zip->addFromString('docProps/app.xml', $this->appXml(count($slides)));
        $zip->addFromString('docProps/core.xml', $this->coreXml());

        foreach ($slides as $index => $slide) {
            $slideNumber = $index + 1;
            $zip->addFromString("ppt/slides/slide{$slideNumber}.xml", $this->slideXml($slide['title'], $slide['body']));
            $zip->addFromString("ppt/slides/_rels/slide{$slideNumber}.xml.rels", $this->slideRelsXml());
        }
    }

    private function xml(string $value): string
    {
        return htmlspecialchars($value, ENT_XML1 | ENT_COMPAT, 'UTF-8');
    }

    private function contentTypesXml(int $slideCount): string
    {
        $slides = '';
        for ($i = 1; $i <= $slideCount; $i++) {
            $slides .= '<Override PartName="/ppt/slides/slide' . $i . '.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>';
        }

        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            . '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
            . '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
            . '<Default Extension="xml" ContentType="application/xml"/>'
            . '<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>'
            . '<Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>'
            . '<Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>'
            . '<Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>'
            . '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>'
            . '<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>'
            . $slides
            . '</Types>';
    }

    private function rootRelsXml(): string
    {
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            . '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            . '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>'
            . '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>'
            . '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>'
            . '</Relationships>';
    }

    private function presentationXml(int $slideCount): string
    {
        $slideIds = '';
        for ($i = 1; $i <= $slideCount; $i++) {
            $slideIds .= '<p:sldId id="' . (255 + $i) . '" r:id="rId' . $i . '"/>';
        }

        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            . '<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">'
            . '<p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId' . ($slideCount + 1) . '"/></p:sldMasterIdLst>'
            . '<p:sldIdLst>' . $slideIds . '</p:sldIdLst>'
            . '<p:sldSz cx="12192000" cy="6858000" type="wide"/>'
            . '<p:notesSz cx="6858000" cy="9144000"/>'
            . '</p:presentation>';
    }

    private function presentationRelsXml(int $slideCount): string
    {
        $rels = '';
        for ($i = 1; $i <= $slideCount; $i++) {
            $rels .= '<Relationship Id="rId' . $i . '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide' . $i . '.xml"/>';
        }

        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            . '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            . $rels
            . '<Relationship Id="rId' . ($slideCount + 1) . '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>'
            . '</Relationships>';
    }

    private function slideXml(string $title, string $body): string
    {
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            . '<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">'
            . '<p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>'
            . $this->textBoxXml(2, 'Title', 685800, 457200, 10820400, 914400, $title, 3600, true)
            . $this->textBoxXml(3, 'Body', 914400, 1676400, 10363200, 3962400, $body, 1800, false)
            . '</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>';
    }

    private function textBoxXml(int $id, string $name, int $x, int $y, int $cx, int $cy, string $text, int $fontSize, bool $bold): string
    {
        $boldAttr = $bold ? ' b="1"' : '';

        return '<p:sp><p:nvSpPr><p:cNvPr id="' . $id . '" name="' . $name . '"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>'
            . '<p:spPr><a:xfrm><a:off x="' . $x . '" y="' . $y . '"/><a:ext cx="' . $cx . '" cy="' . $cy . '"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln><a:noFill/></a:ln></p:spPr>'
            . '<p:txBody><a:bodyPr wrap="square"/><a:lstStyle/><a:p><a:r><a:rPr lang="en-US" sz="' . $fontSize . '"' . $boldAttr . '/><a:t>' . $this->xml($text) . '</a:t></a:r></a:p></p:txBody>'
            . '</p:sp>';
    }

    private function slideRelsXml(): string
    {
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            . '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            . '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>'
            . '</Relationships>';
    }

    private function slideMasterXml(): string
    {
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            . '<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">'
            . '<p:cSld><p:bg><p:bgPr><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill><a:effectLst/></p:bgPr></p:bg><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld>'
            . '<p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>'
            . '<p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst>'
            . '<p:txStyles><p:titleStyle/><p:bodyStyle/><p:otherStyle/></p:txStyles>'
            . '</p:sldMaster>';
    }

    private function slideMasterRelsXml(): string
    {
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            . '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            . '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>'
            . '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/>'
            . '</Relationships>';
    }

    private function slideLayoutXml(): string
    {
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            . '<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank" preserve="1">'
            . '<p:cSld name="Blank"><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld>'
            . '<p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>'
            . '</p:sldLayout>';
    }

    private function slideLayoutRelsXml(): string
    {
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            . '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            . '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>'
            . '</Relationships>';
    }

    private function themeXml(): string
    {
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            . '<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="NOVAIS">'
            . '<a:themeElements><a:clrScheme name="NOVAIS"><a:dk1><a:srgbClr val="111827"/></a:dk1><a:lt1><a:srgbClr val="FFFFFF"/></a:lt1><a:dk2><a:srgbClr val="1F2937"/></a:dk2><a:lt2><a:srgbClr val="F9FAFB"/></a:lt2><a:accent1><a:srgbClr val="2563EB"/></a:accent1><a:accent2><a:srgbClr val="14B8A6"/></a:accent2><a:accent3><a:srgbClr val="F59E0B"/></a:accent3><a:accent4><a:srgbClr val="EF4444"/></a:accent4><a:accent5><a:srgbClr val="8B5CF6"/></a:accent5><a:accent6><a:srgbClr val="10B981"/></a:accent6><a:hlink><a:srgbClr val="2563EB"/></a:hlink><a:folHlink><a:srgbClr val="7C3AED"/></a:folHlink></a:clrScheme><a:fontScheme name="NOVAIS"><a:majorFont><a:latin typeface="Arial"/></a:majorFont><a:minorFont><a:latin typeface="Arial"/></a:minorFont></a:fontScheme><a:fmtScheme name="NOVAIS"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst><a:lnStyleLst><a:ln w="9525"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst></a:fmtScheme></a:themeElements>'
            . '<a:objectDefaults/><a:extraClrSchemeLst/>'
            . '</a:theme>';
    }

    private function appXml(int $slideCount): string
    {
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            . '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">'
            . '<Application>NOVAIS</Application><PresentationFormat>Widescreen</PresentationFormat><Slides>' . $slideCount . '</Slides>'
            . '</Properties>';
    }

    private function coreXml(): string
    {
        $now = now()->toAtomString();

        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            . '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">'
            . '<dc:title>NOVAIS Course Export</dc:title><dc:creator>NOVAIS</dc:creator><cp:lastModifiedBy>NOVAIS</cp:lastModifiedBy>'
            . '<dcterms:created xsi:type="dcterms:W3CDTF">' . $now . '</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">' . $now . '</dcterms:modified>'
            . '</cp:coreProperties>';
    }
}
