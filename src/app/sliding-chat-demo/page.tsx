import { ApplicationLayout } from "@/components/layout/ApplicationLayout";

export default function SlidingChatDemo() {
  return (
    <ApplicationLayout
      applicationName="Sliding Chat Demo"
      chatWelcomeMessage="Welcome to the new sliding chat interface!"
      chatPlaceholder="Try the new sleek chat design..."
      showChat={true}
      chatWidth={450}
    >
      <div className="p-8 space-y-6">
        <div className="max-w-4xl">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Sliding Chat Interface Demo
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            This page demonstrates the new sliding chat panel with sleek, straight-line design.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 border border-gray-200 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                🎨 Design Features
              </h2>
              <ul className="space-y-2 text-gray-600">
                <li>• Straight lines, no rounded corners</li>
                <li>• Sliding panel animation</li>
                <li>• Clean, minimalist design</li>
                <li>• Responsive behavior</li>
                <li>• Collapsible interface</li>
              </ul>
            </div>
            
            <div className="bg-white p-6 border border-gray-200 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                ⚡ Functionality
              </h2>
              <ul className="space-y-2 text-gray-600">
                <li>• AI provider switching</li>
                <li>• Bedrock Agent integration</li>
                <li>• Multiple LLM support</li>
                <li>• Real-time streaming</li>
                <li>• Comprehensive logging</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 p-6 bg-gray-50 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              💡 How to Use
            </h3>
            <ol className="space-y-2 text-gray-600">
              <li>1. The chat panel slides in from the right side</li>
              <li>2. Click the arrow button to hide the chat panel</li>
              <li>3. Click the message icon to show it again</li>
              <li>4. Use the settings gear to switch AI providers</li>
              <li>5. Try both AI Agents and standard LLMs</li>
            </ol>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="bg-white p-4 border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2">Content Block {item}</h4>
                <p className="text-sm text-gray-600">
                  This is sample content to demonstrate how the main area responds to the sliding chat panel.
                  The content adjusts its width when the panel opens and closes.
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ApplicationLayout>
  );
}
