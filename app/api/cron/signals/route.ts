import { NextResponse } from "next/server"; import { signals, auth } from "@/lib/server/youtube-discovery";
async function run(request:Request){const denied=await auth(request);if(denied)return denied;try{return NextResponse.json({ok:true,job:"signals",...(await signals())});}catch(error){console.error("signals failed",error);return NextResponse.json({ok:false,state:"SIGNALS_FAILED",error:error instanceof Error?error.message:"unknown"},{status:502});}}
export async function GET(request:Request){return run(request);}
export async function POST(request:Request){return run(request);}
