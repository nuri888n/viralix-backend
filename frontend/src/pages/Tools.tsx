import { useState } from "react";
import { runCaptionsTool } from "../lib/api";
import Layout from "../components/Layout";
import { Wrench } from "lucide-react";

export default function Tools() {
  const [topic, setTopic] = useState("Leg Day Pump");
  const [tone, setTone] = useState("fun");
  const [caption, setCaption] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRun() {
    setLoading(true);
    setError(null);
    setCaption(null);
    try {
      const result = await runCaptionsTool({ topic, tone });
      setCaption(result.caption);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <div className="px-4 sm:px-0">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900">Tools</h1>
            <p className="mt-2 text-sm text-gray-700">
              AI-powered tools to help with your content creation
            </p>
          </div>
        </div>

        <div className="mt-8">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center mb-4">
                <Wrench className="h-6 w-6 text-primary-600 mr-2" />
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Caption Generator
                </h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="topic" className="block text-sm font-medium text-gray-700">
                    Topic
                  </label>
                  <input
                    id="topic"
                    type="text"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    value={topic}
                    onChange={(event) => setTopic(event.target.value)}
                    placeholder="Enter the topic for your caption..."
                  />
                </div>

                <div>
                  <label htmlFor="tone" className="block text-sm font-medium text-gray-700">
                    Tone
                  </label>
                  <select
                    id="tone"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    value={tone}
                    onChange={(event) => setTone(event.target.value)}
                  >
                    <option value="neutral">Neutral</option>
                    <option value="fun">Fun</option>
                    <option value="serious">Serious</option>
                  </select>
                </div>

                <button
                  onClick={handleRun}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  {loading ? "Generating..." : "Generate Caption"}
                </button>

                {caption && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
                    <h4 className="font-medium text-green-800 mb-2">Generated Caption:</h4>
                    <p className="text-green-700">{caption}</p>
                  </div>
                )}

                {error && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-700">{error}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
