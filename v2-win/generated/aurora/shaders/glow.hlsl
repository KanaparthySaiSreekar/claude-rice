// Claude Aurora glow: a Windows Terminal pixel shader.
//   * soft bloom: bright text bleeds a coloured halo (coral text glows coral, cyan glows cyan)
//   * a faint vignette that settles the corners
//   * optional scanline weave (off by default)
// It does not read Time, so it never needs to animate. Edit the three constants below to taste.
//
// Windows Terminal contract: the terminal image arrives in t0, the settings in b0.
Texture2D shaderTexture : register(t0);
SamplerState samplerState : register(s0);

cbuffer PixelShaderSettings : register(b0)
{
    float  Time;        // seconds since the shader was enabled (unused)
    float  Scale;       // UI scale (1.25 at 125% display scaling)
    float2 Resolution;  // size of the terminal image in pixels
    float4 Background;  // the background colour (unused)
};

#define GLOW_STRENGTH   0.50   // 0 turns the bloom off
#define GLOW_THRESHOLD  0.36   // brightness above which a pixel starts to glow
#define VIGNETTE        0.16   // 0 turns the vignette off
#define SCANLINES       0.00   // try 0.03 for a faint CRT weave

float3 grab(float2 uv) { return shaderTexture.Sample(samplerState, uv).rgb; }

float4 main(float4 pos : SV_POSITION, float2 tex : TEXCOORD) : SV_TARGET
{
    float4 base = shaderTexture.Sample(samplerState, tex);
    float2 px = Scale / Resolution;          // one device-independent pixel in uv space

    float3 glow = float3(0.0, 0.0, 0.0);
    [unroll]
    for (int i = 0; i < 8; i++)
    {
        float a = (float)i * 0.78539816;     // 8 directions
        float2 dir = float2(cos(a), sin(a));
        glow += max(grab(tex + dir * px * 1.6) - GLOW_THRESHOLD, 0.0) * 0.62;
        glow += max(grab(tex + dir * px * 4.2) - GLOW_THRESHOLD, 0.0) * 0.38;
    }
    float3 rgb = base.rgb + glow * (GLOW_STRENGTH / 8.0);

    float2 q = tex - 0.5;
    rgb *= 1.0 - VIGNETTE * dot(q, q) * 2.4;

    rgb *= 1.0 - SCANLINES * (0.5 + 0.5 * sin(pos.y * 3.14159265 / max(Scale, 1.0)));

    return float4(saturate(rgb), base.a);
}
