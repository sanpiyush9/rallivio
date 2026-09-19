import { NextResponse } from "next/server"; import { acquire, auth } from "@/lib/server/youtube-discovery";
async function run(request:Request){const denied=await auth(request);if(denied)return denied;try{return NextResponse.json({ok:true,job:"acquire",...(await acquire())});}catch(error){console.error("acquire failed",error);return NextResponse.json({ok:false,state:"ACQUISITION_FAILED",error:error instanceof Error?error.message:"unknown"},{status:502});}}
export async function GET(request:Request){return run(request);}
export async function POST(request:Request){return run(request);}
